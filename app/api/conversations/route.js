import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyToken, handleError } from "@/lib/auth";

export async function GET(req) {
  try {
    const decoded = verifyToken(req);
    const businessId = decoded.businessId;

    const conversations = await prisma.conversation.findMany({
      where: { businessId },
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
    return handleError(error);
  }
}
