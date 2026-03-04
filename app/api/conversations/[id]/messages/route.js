// app/api/conversations/[id]/messages/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyToken, handleError } from "@/lib/auth";
import { getSocket, initWhatsAppSocket } from "@/lib/whatsapp";
import { getAIResponse } from "@/lib/ai";

// ── Helper: normalize JID kwa ajili ya kutuma ─────────────────────
function getSendJid(externalId = "") {
  if (!externalId.startsWith("wa_")) return null;
  const parts = externalId.split("_");
  if (parts.length < 2) return null;
  const phone = parts[1].split("@")[0].split(":")[0];
  return `${phone}@s.whatsapp.net`;
}

export async function POST(req, { params }) {
  try {
    const { id: conversationId } = params;
    const { text, sender } = await req.json();

    const { businessId } = verifyToken(req);

    // Find the conversation and verify ownership
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, businessId },
      include: { 
        business: { include: { agentConfig: true, agentFaqs: true } },
      }
    });

    if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    // Save message
    const senderType = sender === "customer" ? "CUSTOMER" : "HUMAN_AGENT";
    const newMessage = await prisma.message.create({
      data: {
        content: text,
        senderType,
        conversationId,
        businessId
      }
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date(), lastMessageAt: new Date() }
    });

    // If admin is sending message, try to send via WhatsApp
    if (senderType === "HUMAN_AGENT") {
       let socket = getSocket(businessId);
       
       if (!socket?.user) {
         console.warn(`[WA:${businessId}] Socket is missing from memory during manual send. Re-initializing...`);
         socket = await initWhatsAppSocket(businessId);
       }

       const sendJid = getSendJid(conversation.externalId);
       if (socket && sendJid) {
          console.log(`[WA:${businessId}] Sending manual message to ${sendJid}`);
          await socket.sendMessage(sendJid, { text });
       }
    }

    // If message is from customer, generate AI response
    if (senderType === "CUSTOMER" && !conversation.isHumanHandling) {
      const config = conversation.business.agentConfig;
      const faqs = conversation.business.agentFaqs;

      const history = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: 10
      });

      try {
        const aiResult = await getAIResponse({
          message: text,
          agentConfig: config ? { ...config, faqs } : { faqs },
          businessName: conversation.business.name,
          channel: conversation.channelType || "WHATSAPP",
          conversationHistory: history.reverse(),
        });

        if (aiResult.text) {
          const aiMessage = await prisma.message.create({
            data: {
              content: aiResult.text,
              senderType: "AI",
              conversationId,
              businessId,
              openclawModelUsed: aiResult.modelUsed,
              openclawLatencyMs: aiResult.latencyMs
            }
          });

          // Send to WhatsApp
          const socket = getSocket(businessId);
          const sendJid = getSendJid(conversation.externalId);
          if (socket && sendJid) {
             await socket.sendMessage(sendJid, { text: aiResult.text });
          }

          return NextResponse.json({ userMessage: newMessage, aiMessage });
        }
      } catch (aiErr) {
        console.error("AI Error in route:", aiErr.message);
      }
    }

    return NextResponse.json({ userMessage: newMessage });

  } catch (error) {
    return handleError(error);
  }
}

export async function GET(req, { params }) {
  try {
    const { id: conversationId } = params;
    const { businessId } = verifyToken(req);

    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, businessId }
    });

    if (!conv) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json(messages);
  } catch (error) {
    return handleError(error);
  }
}
