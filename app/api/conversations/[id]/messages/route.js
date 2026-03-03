// app/api/conversations/[id]/messages/route.js
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import OpenClaw from "@/lib/openclaw";

const SECRET = process.env.JWT_SECRET || "carebot_secret_key_2026";

export async function POST(req, { params }) {
  try {
    const { id: conversationId } = params;
    const { text, sender } = await req.json(); // sender can be 'admin' or 'customer'

    // Get the auth user if sender is admin
    const authHeader = req.headers.get("authorization");
    let businessId = null;

    if (authHeader) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, SECRET);
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      businessId = user.businessId;
    }

    // Find the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { business: { include: { agentConfig: true, faqs: true } } }
    });

    if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        text,
        sender: sender || "admin",
        conversationId
      }
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    // If message is from customer, generate AI response
    if (sender === "customer") {
      const config = conversation.business.agentConfig || { 
        agentName: "Msaidizi", 
        systemPrompt: "Wewe ni msaidizi wa AI.", 
        tone: "friendly", 
        model: "gpt-4o" 
      };

      const history = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: 10
      });

      const aiLayer = new OpenClaw({
        model: config.model,
        systemPrompt: config.systemPrompt,
        tone: config.tone
      });

      const aiResponseText = await aiLayer.generateResponse(
        text, 
        history.reverse(), 
        conversation.business.faqs
      );

      const aiMessage = await prisma.message.create({
        data: {
          text: aiResponseText,
          sender: "ai",
          conversationId
        }
      });

      return NextResponse.json({ userMessage, aiMessage });
    }

    return NextResponse.json({ userMessage });

  } catch (error) {
    console.error("Message Error:", error);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}

export async function GET(req, { params }) {
  try {
    const { id: conversationId } = params;
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
