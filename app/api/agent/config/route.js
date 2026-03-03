// app/api/agent/config/route.js
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

  let config = await prisma.agentConfig.findUnique({
    where: { businessId: user.businessId }
  });

  // Create default if not exists
  if (!config) {
    config = await prisma.agentConfig.create({
      data: {
        businessId: user.businessId,
        agentName: user.business.name + " Bot",
        systemPrompt: user.business.description || "Wewe ni msaidizi wa AI.",
        tone: "friendly",
        model: "gpt-4o"
      }
    });
  }

  return NextResponse.json(config);
}

export async function PATCH(req) {
  const user = await getAuthUser(req);
  if (!user || !user.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const updated = await prisma.agentConfig.upsert({
    where: { businessId: user.businessId },
    update: {
      agentName: body.agentName,
      systemPrompt: body.systemPrompt,
      tone: body.tone,
      model: body.model
    },
    create: {
      businessId: user.businessId,
      agentName: body.agentName,
      systemPrompt: body.systemPrompt,
      tone: body.tone,
      model: body.model
    }
  });

  return NextResponse.json(updated);
}
