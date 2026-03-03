// lib/whatsapp.js
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import path from "path";
import fs from "fs";
import prisma from "./prisma";
import OpenClaw from "./openclaw";

const g = global;
if (!g.__carebot) {
  g.__carebot = {
    sockets: {},   
    qrCodes: {},   
    statuses: {},  
  };
}
export const store = g.__carebot;

export const logoutWhatsApp = async (businessId) => {
  const socket = store.sockets[businessId];
  const authDir = path.join(process.cwd(), "auth_info_baileys", businessId);

  if (socket) {
    try {
      await socket.logout();
      await socket.end();
    } catch (e) { console.error("Socket logout error", e); }
    delete store.sockets[businessId];
  }
  
  if (fs.existsSync(authDir)) {
    try {
      fs.rmSync(authDir, { recursive: true, force: true });
    } catch (e) { console.error("Error deleting auth folder", e); }
  }

  store.statuses[businessId] = "disconnected";
  store.qrCodes[businessId] = null;
  
  await prisma.channel.updateMany({
    where: { businessId, type: 'WHATSAPP' },
    data: { status: 'DISCONNECTED' }
  });
};

export async function initWhatsAppSocket(businessId, onQR) {
  if (store.sockets[businessId]?.user) {
    store.statuses[businessId] = "open";
    return store.sockets[businessId];
  }

  const authDir = path.join(process.cwd(), "auth_info_baileys", businessId);
  if (store.statuses[businessId] === "disconnected" && fs.existsSync(authDir)) {
     fs.rmSync(authDir, { recursive: true, force: true });
  }

  store.statuses[businessId] = "connecting";
  store.qrCodes[businessId] = null;

  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  const socket = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    browser: ["CareBot", "Chrome", "1.0.0"],
    connectTimeoutMs: 60_000,
  });

  store.sockets[businessId] = socket;

  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      store.qrCodes[businessId] = qr;
      store.statuses[businessId] = "qr";
      if (onQR) onQR(qr);
    }
    if (connection === "open") {
      store.statuses[businessId] = "open";
      store.qrCodes[businessId] = null;
      const userJid = socket.user?.id?.split(':')[0] || "";
      try {
        await prisma.channel.upsert({
          where: { businessId_type: { businessId, type: 'WHATSAPP' } },
          update: { status: 'CONNECTED', phoneNumber: '+' + userJid },
          create: { type: 'WHATSAPP', status: 'CONNECTED', phoneNumber: '+' + userJid, businessId }
        });
      } catch (e) { console.error("DB Update error", e.message); }
    }
    if (connection === "close") {
      const code = (lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut && code !== 401;
      if (!shouldReconnect) {
        if (fs.existsSync(authDir)) fs.rmSync(authDir, { recursive: true, force: true });
        delete store.sockets[businessId];
        store.statuses[businessId] = "disconnected";
      } else {
        delete store.sockets[businessId];
        setTimeout(() => initWhatsAppSocket(businessId, onQR), 3000);
      }
    }
  });

  socket.ev.on("creds.update", saveCreds);

  socket.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.key.fromMe && msg.message) {
        const remoteJid = msg.key.remoteJid;
        const customerPhone = remoteJid.replace("@s.whatsapp.net", "").replace("@c.us", "");
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
        const customerName = msg.pushName || customerPhone;

        if (!text) continue;
        console.log(`[WA] Meseji mpya kutoka ${customerName}: ${text}`);

        try {
          // ── 1. Upsert Conversation (Unique kwa kila biashara) ──
          const conversationExternalId = `wa_${customerPhone}_${businessId}`;

          const conversation = await prisma.conversation.upsert({
            where: { externalId: conversationExternalId },
            update: { lastMessage: text, updatedAt: new Date(), customer: customerName },
            create: { externalId: conversationExternalId, businessId, status: 'open', lastMessage: text, customer: customerName }
          });

          // ── 2. Hifadhi Meseji ya Mteja ──
          await prisma.message.create({
            data: { text, sender: 'customer', conversationId: conversation.id }
          });

          console.log(`[WA] ✓ Meseji imehifadhiwa kwenye DB (ID: ${conversation.id})`);

          // ── 3. AI Response Flow ──
          const businessData = await prisma.business.findUnique({
            where: { id: businessId },
            include: { agentConfig: true, faqs: true }
          });

          if (businessData) {
            try {
              const aiLayer = new OpenClaw({
                model: businessData.agentConfig?.model || "gpt-4o",
                systemPrompt: businessData.agentConfig?.systemPrompt || "Wewe ni msaidizi wa AI.",
                tone: businessData.agentConfig?.tone || "friendly"
              });

              const responseText = await aiLayer.generateResponse(text, [], businessData.faqs);
              
              if (responseText) {
                await socket.sendMessage(remoteJid, { text: responseText });
                await prisma.message.create({
                  data: { text: responseText, sender: 'ai', conversationId: conversation.id }
                });
                console.log(`[WA] ✓ AI imejibu na kuhifadhiwa.`);
              }
            } catch (aiErr) {
              console.error("[AI Error] Ilishindwa kujibu lakini meseji ya mteja imehifadhiwa:", aiErr.message);
            }
          }
        } catch (dbErr) {
          console.error("[WA DB Error] Kosa la kuhifadhi:", dbErr.message);
          if (dbErr.message.includes("externalId")) {
             console.error("[WA] ⚠️ Prisma Client out of sync! Fanya 'npx prisma generate'");
          }
        }
      }
    }
  });

  return socket;
}

// DEBUG: Angalia DB baada ya sekunde 10
setTimeout(async () => {
  try {
    const cCount = await prisma.conversation.count();
    const mCount = await prisma.message.count();
    console.log(`[DEBUG DB] Conversations: ${cCount}, Messages: ${mCount}`);
  } catch (e) {}
}, 10000);

export const getQR = (businessId) => store.qrCodes[businessId] || null;
export const getStatus = (businessId) => store.statuses[businessId] || "idle";
export const getSocket = (businessId) => store.sockets[businessId] || null;
