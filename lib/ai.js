// lib/ai.js
// ═══════════════════════════════════════════════════════════════
// CareBot AI Engine — OpenRouter (API moja, models zote)
// HAKUNA OpenClaw — OpenRouter inashughulikia routing yote
// ═══════════════════════════════════════════════════════════════

export const AVAILABLE_MODELS = {
  "auto": {
    id: "anthropic/claude-3-haiku",
    label: "Auto (Haiku — Haraka & Nafuu)",
    tier: "all",
  },
  "claude-haiku": {
    id: "anthropic/claude-3-haiku",
    label: "Claude Haiku (Haraka)",
    tier: "all",
  },
  "claude-sonnet": {
    id: "anthropic/claude-3.5-sonnet",
    label: "Claude Sonnet (Bora)",
    tier: "pro",
  },
  "gpt-4o-mini": {
    id: "openai/gpt-4o-mini",
    label: "GPT-4o Mini (Nafuu)",
    tier: "all",
  },
  "gpt-4o": {
    id: "openai/gpt-4o",
    label: "GPT-4o (Nguvu)",
    tier: "pro",
  },
  "llama3": {
    id: "meta-llama/llama-3.1-8b-instruct",
    label: "Llama 3.1 (Bure)",
    tier: "all",
  },
  "gemini-flash": {
    id: "google/gemini-flash-1.5",
    label: "Gemini Flash (Haraka)",
    tier: "all",
  },
};

function buildSystemPrompt({ agentConfig, businessName, channel }) {
  const name = agentConfig?.agentName || "Msaidizi";
  const tone = agentConfig?.agentTone || "friendly";
  const custom = agentConfig?.systemPrompt || "";
  const faqs = agentConfig?.faqs || [];
  const channel_note = channel === "WHATSAPP"
    ? "Unawasiliana kwenye WhatsApp. Jibu KWA UFUPI (max mistari 4). Epuka markdown."
    : "Unawasiliana kwenye Instagram DM. Jibu kwa urafiki na ufupi.";

  const toneGuide = {
    friendly: "Jibu kwa upole, urafiki, na emoji kidogo.",
    professional: "Jibu kwa lugha rasmi na ya kitaalamu.",
    casual: "Jibu kwa lugha ya kawaida, relaxed.",
  }[tone] || "Jibu kwa upole.";

  const faqBlock = faqs.length > 0
    ? `\n\nMAASWALI YA MARA KWA MARA:\n${faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}`
    : "";

  return `Wewe ni ${name}, msaidizi wa customer care wa "${businessName}".

TABIA: ${toneGuide}
CHANNEL: ${channel_note}

MAELEZO YA BIASHARA:
${custom || `Msaada customers wa ${businessName} kwa upole na usahihi.`}${faqBlock}

SHERIA MUHIMU:
- Usijibu maswali nje ya biashara hii
- Kama hujui jibu, sema: "Nitahakikisha na kukujibu hivi karibuni"
- Jibu daima kwa lugha ambayo customer anaitumia (Swahili au English)
- Usitengeneze bei au sera ambazo hujui`;
}

export async function getAIResponse({
  message,
  agentConfig,
  businessName,
  channel = "WHATSAPP",
  conversationHistory = [],
}) {
  const startTime = Date.now();
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY haipo kwenye .env.local");
  }

  const modelKey = agentConfig?.openclawModel || "auto";
  const modelInfo = AVAILABLE_MODELS[modelKey] || AVAILABLE_MODELS["auto"];
  const modelId = modelInfo.id;

  const history = conversationHistory
    .slice(-10)
    .map(m => ({
      role: m.senderType === "CUSTOMER" ? "user" : "assistant",
      content: m.content || m.text,
    }));

  const systemPrompt = buildSystemPrompt({ agentConfig, businessName, channel });

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://carebot.app",
      "X-Title": "CareBot Customer Care",
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message },
      ],
      max_tokens: agentConfig?.maxResponseTokens || 500,
      temperature: agentConfig?.temperature || 0.7,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("[AI] OpenRouter error:", data);
    throw new Error(data.error?.message || `OpenRouter HTTP ${response.status}`);
  }

  const text = data.choices?.[0]?.message?.content?.trim();
  const latencyMs = Date.now() - startTime;
  const tokens = data.usage?.total_tokens || 0;

  if (!text) throw new Error("AI ilirejesha jibu tupu");

  return { text, modelUsed: modelId, tokens, latencyMs };
}

export function getFallbackResponse(agentConfig) {
  return (
    agentConfig?.fallbackMessage ||
    "Samahani, msaidizi wetu wa AI yuko busy kwa sasa. Tutakujibu hivi karibuni. 🙏"
  );
}
