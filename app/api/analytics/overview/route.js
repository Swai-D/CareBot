import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "No token" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_key");

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { business: true }
    });

    if (!user || !user.businessId) return NextResponse.json({ error: "User not found or no business" }, { status: 404 });

    // Hapa tunahesabu data halisi kutoka database yako
    const totalConversations = await prisma.conversation.count({
      where: { businessId: user.businessId }
    });

    const activeConversations = await prisma.conversation.count({
      where: { businessId: user.businessId, updatedAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Active last 24h
    });

    const totalMessages = await prisma.message.count({
      where: { conversation: { businessId: user.businessId } }
    });

    return NextResponse.json({
      totalConversations,
      activeConversations,
      totalMessages,
      aiResolutionRate: 85, // Dummy value kwa sasa
      chartData: [
        { name: "Jumatatu", active: 4, resolved: 2 },
        { name: "Jumanne", active: 3, resolved: 5 },
        { name: "Jumatano", active: 2, resolved: 1 },
        { name: "Alhamisi", active: 6, resolved: 4 },
        { name: "Ijumaa", active: 8, resolved: 6 },
        { name: "Jumamosi", active: 5, resolved: 3 },
        { name: "Jumapili", active: 7, resolved: 4 },
      ]
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
