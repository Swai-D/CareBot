import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const SECRET = process.env.JWT_SECRET || "carebot_secret_key_2026";

async function getAuthUser(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    return await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { business: true }
    });
  } catch { return null; }
}

export async function GET(req) {
  const user = await getAuthUser(req);
  if (!user || !user.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = user.business;

  // Mahesabu ya usage ya mwezi huu
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const messagesCount = await prisma.message.count({
    where: {
      conversation: { businessId: business.id },
      sender: 'ai', // Tunatuma AI messages tu kwenye limit? Au zote?
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
}
