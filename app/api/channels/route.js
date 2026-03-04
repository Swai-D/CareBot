// app/api/channels/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyToken, handleError } from "@/lib/auth";
import { initWhatsAppSocket, store } from "@/lib/whatsapp";

export async function GET(req) {
  try {
    const { businessId } = verifyToken(req);

    const channels = await prisma.channel.findMany({
      where: { businessId }
    });

    // Warmup: Kama DB inasema CONNECTED lakini socket haipo kwenye memory (e.g. server imerestart)
    // basi anzisha socket kimyakimya.
    for (const channel of channels) {
      if (channel.type === "WHATSAPP" && channel.status === "CONNECTED") {
        if (!store.sockets[businessId]?.user) {
          console.log(`[WA:${businessId}] Warmup: Re-initializing socket from memory check`);
          initWhatsAppSocket(businessId).catch(err => {
            console.error(`[WA:${businessId}] Warmup failed:`, err.message);
          });
        }
      }
    }

    return NextResponse.json(channels);
  } catch (err) {
    return handleError(err);
  }
}

import { logoutWhatsApp } from "@/lib/whatsapp";

export async function DELETE(req) {
  try {
    const { businessId } = verifyToken(req);
    const { id, type } = await req.json();
    
    // Kama ni WhatsApp, kata socket kwanza
    if (type === 'WHATSAPP') {
      await logoutWhatsApp(businessId);
    }

    await prisma.channel.delete({
      where: { id, businessId }
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
