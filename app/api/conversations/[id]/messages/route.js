// app/api/conversations/[id]/messages/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyToken, handleError } from "@/lib/auth";
import { getSocket, initWhatsAppSocket, sendWithRetry } from "@/lib/whatsapp";
import { getAIResponse } from "@/lib/ai";

export async function POST(req, { params }) {
  try {
    const { id: conversationId } = params;
    const { text, sender } = await req.json();

    const { businessId } = verifyToken(req);

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, businessId },
      include: { 
        business: { include: { agentConfig: true, agentFaqs: true } },
      }
    });

    if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    const senderType = sender === "customer" ? "CUSTOMER" : "HUMAN_AGENT";
    const newMessage = await prisma.message.create({
      data: {
        content: text,
        senderType,
        conversationId,
        businessId
      }
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date(), lastMessageAt: new Date() }
    });

    // ✅ KAMA NI ADMIN: Tuma kwenda WhatsApp
    if (senderType === "HUMAN_AGENT") {
       // ✅ FIX: Tumia customerId moja kwa moja kwani sasa hivi ni Full JID
       const sendJid = conversation.customerId;
       
       if (sendJid && sendJid.includes("@")) {
          console.log(`[WA:${businessId}] Dashboard manual sending to ${sendJid}...`);
          const sent = await sendWithRetry(businessId, sendJid, text);
          if (sent) console.log(`[WA:${businessId}] ✓ Manual message sent!`);
       } else {
          console.warn(`[WA:${businessId}] Invalid JID for manual send: ${sendJid}`);
       }
    }

    // KAMA NI CUSTOMER: AI Response Flow
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

          // ✅ AI Send Logic pia itumie customerId moja kwa moja
          const sendJid = conversation.customerId;
          if (sendJid && sendJid.includes("@")) {
             await sendWithRetry(businessId, sendJid, aiResult.text);
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
