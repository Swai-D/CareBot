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

    const conversations = await prisma.conversation.findMany({
      where: { businessId: user.businessId },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json(conversations);

  } catch (error) {
    console.error("Conversations Error:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}
