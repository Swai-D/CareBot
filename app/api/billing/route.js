import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyToken, handleError } from "@/lib/auth";

export async function GET(req) {
  try {
    const decoded = verifyToken(req);
    const businessId = decoded.businessId;

    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    // Mahesabu ya usage ya mwezi huu
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const messagesCount = await prisma.message.count({
      where: {
        businessId: business.id,
        senderType: 'AI', 
        createdAt: { gte: startOfMonth }
      }
    });

    // Plan Details
    const plans = {
      FREE: { name: "Free", limit: 100, price: 0 },
      STARTER: { name: "Starter", limit: 1000, price: 25000 },
      GROWTH: { name: "Growth", limit: 5000, price: 75000 },
      PRO: { name: "Pro", limit: Infinity, price: 150000 }
    };

    const currentPlan = plans[business.plan] || plans.FREE;

    return NextResponse.json({
      plan: business.plan,
      planName: currentPlan.name,
      messagesUsed: messagesCount,
      messagesLimit: currentPlan.limit,
      price: currentPlan.price,
      currency: "TZS"
    });
  } catch (err) {
    return handleError(err);
  }
}
