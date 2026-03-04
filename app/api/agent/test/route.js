// app/api/agent/test/route.js
// Dashboard inatumia hii "Test Agent" feature — jaribu AI kabla ya kwenda live

import { NextResponse } from "next/server";
import { verifyToken, handleError } from "@/lib/auth";
import { getAIResponse }            from "@/lib/ai";
import prisma                        from "@/lib/prisma";

export async function POST(request) {
  try {
    const decoded    = verifyToken(request);
    const businessId = decoded.businessId;
    const { message } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Ujumbe ni tupu" }, { status: 400 });
    }

    // Pata agent config na business
    const [agentConfig, business] = await Promise.all([
      prisma.agentConfig.findUnique({ where: { businessId } }),
      prisma.business.findUnique({ where: { id: businessId } }),
    ]);

    let faqs = [];
    try {
      faqs = await prisma.agentFaq.findMany({
        where:  { businessId, isActive: true },
        take:   20,
      });
    } catch {}

    const result = await getAIResponse({
      message,
      agentConfig: agentConfig ? { ...agentConfig, faqs } : { faqs },
      businessName: business?.name || "Biashara",
      channel: "WHATSAPP",
      conversationHistory: [],
    });

    return NextResponse.json({
      response:  result.text,
      modelUsed: result.modelUsed,
      latencyMs: result.latencyMs,
      tokens:    result.tokens,
    });

  } catch (err) {
    return handleError(err);
  }
}
