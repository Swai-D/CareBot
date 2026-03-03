// app/api/channels/whatsapp/route.js
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { initWhatsAppSocket, getQR, getStatus } from "@/lib/whatsapp";

const SECRET = process.env.JWT_SECRET || "carebot_secret_key_2026";

async function getAuthUser(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    return await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
  } catch { return null; }
}

export async function GET(req) {
  const user = await getAuthUser(req);
  if (!user || !user.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = user.businessId;
  const qr = getQR(businessId);
  const status = getStatus(businessId);

  return NextResponse.json({ qr, status });
}

export async function POST(req) {
  const user = await getAuthUser(req);
  if (!user || !user.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { phoneNumber } = await req.json();
    const businessId = user.businessId;

    // Hifadhi kwenye DB kwanza (wrap in try ili isikwamishe socket kama DB ina error)
    try {
      await prisma.channel.upsert({
        where: { businessId_type: { businessId, type: 'WHATSAPP' } },
        update: { phoneNumber, status: 'INITIALIZING' },
        create: { businessId, type: 'WHATSAPP', phoneNumber, status: 'INITIALIZING' }
      });
    } catch (e) { console.warn("DB Upsert Warning:", e.message); }

    // Anzisha socket
    initWhatsAppSocket(businessId).catch(err => {
      console.error("[WA Init Error]", err);
    });

    return NextResponse.json({ message: "WhatsApp started", status: "connecting" });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
