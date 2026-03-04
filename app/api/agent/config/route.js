// app/api/agent/config/route.js

import { NextResponse } from "next/server";
import { verifyToken, handleError } from "@/lib/auth";
import prisma from "@/lib/prisma";

// ── GET /api/agent/config ─────────────────────────────────────────
export async function GET(request) {
  try {
    const { businessId } = verifyToken(request);

    const config = await prisma.agentConfig.findUnique({
      where: { businessId },
    });

    return NextResponse.json(config || {});
  } catch (err) {
    return handleError(err);
  }
}

// ── PATCH /api/agent/config ───────────────────────────────────────
export async function PATCH(request) {
  try {
    const { businessId } = verifyToken(request);
    const body = await request.json();

    // Fields zinazoruhusiwa kubadilishwa
    const allowed = [
      "agentName", "agentTone", "systemPrompt",
      "greetingMessage", "fallbackMessage", "escalationMessage",
      "openclawModel",  // ← hii ndiyo model selector
      "maxResponseTokens", "temperature",
      "autoEscalate", "escalateAfter",
      "businessHours", "outOfHoursMessage",
    ];

    const data = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Hakuna mabadiliko" }, { status: 400 });
    }

    const config = await prisma.agentConfig.upsert({
      where:  { businessId },
      update: { ...data, updatedAt: new Date() },
      create: { businessId, ...data },
    });

    console.log(`[Agent] Config imesasishwa kwa ${businessId}: model=${config.openclawModel}`);

    return NextResponse.json(config);
  } catch (err) {
    return handleError(err);
  }
}
