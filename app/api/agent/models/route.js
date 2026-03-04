// app/api/agent/models/route.js
// Frontend inaitumia kupata list ya models available

import { NextResponse } from "next/server";
import { verifyToken, handleError } from "@/lib/auth";
import { AVAILABLE_MODELS } from "@/lib/ai";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const decoded  = verifyToken(request);
    const businessId = decoded.businessId;

    // Angalia plan ya business — pro models zinahitaji pro plan
    const sub = await prisma.subscription.findUnique({
      where: { businessId },
    });
    const plan = sub?.plan || "free";

    // Filter models kulingana na plan
    const models = Object.entries(AVAILABLE_MODELS).map(([key, info]) => ({
      key,
      label:   info.label,
      tier:    info.tier,
      locked:  info.tier === "pro" && plan === "free",
    }));

    return NextResponse.json({ models, currentPlan: plan });
  } catch (err) {
    return handleError(err);
  }
}
