// lib/whatsapp.js
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  processId,
  isJidLid
} from "@whiskeysockets/baileys";
import { Boom }                               from "@hapi/boom";
import path                                   from "path";
import fs                                     from "fs";
import prisma                                 from "@/lib/prisma";
import { getAIResponse, getFallbackResponse } from "@/lib/ai";

const g = global;
if (!g.__carebot) {
  g.__carebot = { sockets: {}, qrCodes: {}, statuses: {} };
}
export const store = g.__carebot;

// ── Helper: Retry logic iliyoboreshwa ─────────────────────────────
async function sendWithRetry(businessId, jid, text, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const socket = store.sockets[businessId];

    if (!socket || store.statuses[businessId] !== "open") {
      console.warn(`[WA:${businessId}] Socket haiko tayari, inasubiri... (${attempt})`);
      await new Promise(r => setTimeout(r, 3000 * attempt));
      continue;
    }

    try {
      await socket.sendMessage(jid, { text });
      return true;
    } catch (err) {
      const errMsg = err?.message || "";
      if (errMsg.includes("Closed") || errMsg.includes("Precondition") || attempt < maxRetries) {
        console.warn(`[WA:${businessId}] Kutuma kimefeli (${errMsg}), retry ${attempt}...`);
        await new Promise(r => setTimeout(r, 2000 * attempt));
        continue;
      }
      throw err;
    }
  }
  return false;
}

// ── Logout Function ───────────────────────────────────────────────
export const logoutWhatsApp = async (businessId) => {
  const socket = store.sockets[businessId];
  const authDir = path.join(process.cwd(), "auth_info_baileys", businessId);
  if (socket) {
    try { await socket.logout(); await socket.end(); } catch (e) {}
    delete store.sockets[businessId];
  }
  if (fs.existsSync(authDir)) {
    try { fs.rmSync(authDir, { recursive: true, force: true }); } catch (e) {}
  }
  store.statuses[businessId] = "disconnected";
  store.qrCodes[businessId] = null;
  await prisma.channel.updateMany({
    where: { businessId, type: 'WHATSAPP' },
    data: { status: 'DISCONNECTED' }
  });
};

// ── Anzisha WhatsApp socket ───────────────────────────────────────
export async function initWhatsAppSocket(businessId) {
  if (store.sockets[businessId]?.user) {
    store.statuses[businessId] = "open";
    return store.sockets[businessId];
  }

  store.statuses[businessId] = "connecting";
  const authDir = path.join(process.cwd(), "auth_info_baileys", businessId);
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  const socket = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ["CareBot", "Chrome", "1.0.0"],
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
    // Hii inazuia makosa mengi ya XML:
    generateHighQualityLinkPreview: false, 
    syncFullHistory: false,
    retryRequestDelayMs: 5000,
  });

  store.sockets[businessId] = socket;

  socket.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) { store.qrCodes[businessId] = qr; store.statuses[businessId] = "qr"; }
    
    if (connection === "open") {
      store.statuses[businessId] = "open";
      store.qrCodes[businessId] = null;
      console.log(`[WA:${businessId}] ✓ Connected!`);
      await prisma.channel.updateMany({
        where: { businessId, type: "WHATSAPP" },
        data: { status: "CONNECTED" },
      });
    }

    if (connection === "close") {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      store.sockets[businessId] = null;
      store.statuses[businessId] = shouldReconnect ? "connecting" : "logged_out";
      if (shouldReconnect) setTimeout(() => initWhatsAppSocket(businessId), 5000);
    }
  });

  socket.ev.on("creds.update", saveCreds);

  socket.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      if (msg.key.fromMe || !msg.message || msg.key.remoteJid.endsWith("@g.us")) continue;

      const remoteJid = msg.key.remoteJid;
      const customerId = remoteJid.split("@")[0].split(":")[0];
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption;

      if (!text) continue;
      console.log(`[WA:${businessId}] 📨 Kutoka ${customerId}: "${text.substring(0, 50)}"`);

      handleIncomingMessage({
        businessId,
        remoteJid, // Tumia JID halisi (inaweza kuwa @lid au @s.whatsapp.net)
        customerId,
        customerName: msg.pushName || customerId,
        text,
        platformMessageId: msg.key.id
      }).catch(e => console.error("Handler error:", e.message));
    }
  });

  return socket;
}

async function handleIncomingMessage({ businessId, remoteJid, customerId, customerName, text, platformMessageId }) {
  try {
    const sub = await prisma.subscription.findUnique({ where: { businessId } });
    if (sub && sub.plan !== "enterprise" && sub.messagesUsed >= sub.messagesLimit) return;

    const externalId = `wa_${customerId}_${businessId}`;
    const conversation = await prisma.conversation.upsert({
      where: { externalId },
      update: { status: "OPEN", lastMessageAt: new Date(), updatedAt: new Date() },
      create: {
        externalId, businessId, channelType: "WHATSAPP", customerId, 
        customerName, status: "OPEN", lastMessageAt: new Date()
      }
    });

    await prisma.message.create({
      data: { conversationId: conversation.id, businessId, senderType: "CUSTOMER", content: text, platformMessageId }
    });

    if (conversation.isHumanHandling) return;

    const [agentConfig, business, recentMessages] = await Promise.all([
      prisma.agentConfig.findUnique({ where: { businessId } }),
      prisma.business.findUnique({ where: { id: businessId } }),
      prisma.message.findMany({ where: { conversationId: conversation.id }, orderBy: { createdAt: "asc" }, take: 10 })
    ]);

    let faqs = [];
    try { faqs = await prisma.agentFaq.findMany({ where: { businessId, isActive: true }, take: 20 }); } catch (e) {}

    let aiResult;
    try {
      aiResult = await getAIResponse({
        message: text,
        agentConfig: agentConfig ? { ...agentConfig, faqs } : { faqs },
        businessName: business?.name || "Biashara",
        channel: "WHATSAPP",
        conversationHistory: recentMessages
      });
    } catch (e) {
      console.error("AI Error:", e.message);
      aiResult = { text: getFallbackResponse(agentConfig), modelUsed: "fallback", latencyMs: 0 };
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id, businessId, senderType: "AI", 
        content: aiResult.text, openclawModelUsed: aiResult.modelUsed, openclawLatencyMs: aiResult.latencyMs
      }
    });

    // TUMA KWA RETRY LOGIC NA JID HALISI
    const sent = await sendWithRetry(businessId, remoteJid, aiResult.text);
    if (sent) console.log(`[WA:${businessId}] ✓ AI responded to ${customerId}`);

    if (sub) {
      await prisma.subscription.update({ where: { businessId }, data: { messagesUsed: { increment: 1 } } }).catch(() => {});
    }
  } catch (err) {
    console.error(`[WA:${businessId}] ❌ Error:`, err.message);
  }
}

export const getQR = (id) => store.qrCodes[id] || null;
export const getStatus = (id) => store.statuses[id] || "idle";
export const getSocket = (id) => store.sockets[id] || null;
