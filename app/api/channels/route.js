// app/api/channels/route.js
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
      where: { id: decoded.userId }
    });
  } catch { return null; }
}

export async function GET(req) {
  const user = await getAuthUser(req);
  if (!user || !user.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const channels = await prisma.channel.findMany({
      where: { businessId: user.businessId }
    });
    return NextResponse.json(channels);
  } catch (err) {
    console.error("GET Channels error:", err.message);
    return NextResponse.json([]);
  }
}

import { initWhatsAppSocket, getQR, getStatus, logoutWhatsApp } from "@/lib/whatsapp";

// ... (keep auth helpers)

// Hii itatumika ku-update status au kufuta channel
export async function DELETE(req) {
  const user = await getAuthUser(req);
  if (!user || !user.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, type } = await req.json();
    
    // Kama ni WhatsApp, kata socket kwanza
    if (type === 'WHATSAPP') {
      await logoutWhatsApp(user.businessId);
    }

    await prisma.channel.delete({
      where: { id, businessId: user.businessId }
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE Channel error:", err.message);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
