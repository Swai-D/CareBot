// app/api/channels/whatsapp/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { initWhatsAppSocket, getQR, getStatus } from "@/lib/whatsapp";
import { verifyToken, handleError } from "@/lib/auth";

export async function GET(req) {
  try {
    const decoded = verifyToken(req);
    const businessId = decoded.businessId;

    const qr = getQR(businessId);
    const status = getStatus(businessId);

    return NextResponse.json({ qr, status });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req) {
  try {
    const decoded = verifyToken(req);
    const businessId = decoded.businessId;
    const { phoneNumber } = await req.json();

    // Hifadhi kwenye DB kwanza
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
  } catch (err) {
    return handleError(err);
  }
}
