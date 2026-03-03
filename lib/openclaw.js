// lib/openclaw.js
// OpenClaw AI Management Layer — This layer manages the connection to LLM models
// (GPT-4o, Claude 3.5, Llama 3) and ensures context management, tone consistency, 
// and business-specific prompt formatting.

export class OpenClaw {
  constructor(config = {}) {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.config = {
      model: config.model || "gpt-4o",
      systemPrompt: config.systemPrompt || "Wewe ni msaidizi wa AI.",
      tone: config.tone || "friendly",
      ...config
    };
  }

  // Format history for the LLM
  static formatMessages(messages = []) {
    return messages.map(m => ({
      role: m.sender === "customer" ? "user" : "assistant",
      content: m.text
    }));
  }

  async generateResponse(userMessage, history = [], faqs = []) {
    const messages = [
      { role: "system", content: `${this.config.systemPrompt}

Tone yako ni: ${this.config.tone}. 
Tumia taarifa hizi za FAQs kutoa majibu sahihi: 
${JSON.stringify(faqs)}` },
      ...OpenClaw.formatMessages(history),
      { role: "user", content: userMessage }
    ];

    try {
      // For now, this is a placeholder implementation using OpenAI API
      // If we use "OpenClaw as a layer", we could point this to a proxy or LiteLLM
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: messages,
          temperature: 0.7
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      return data.choices[0].message.content;
    } catch (err) {
      console.error("OpenClaw Error:", err);
      return "Samahani, kuna tatizo kidogo na mfumo wangu. Jaribu tena baadaye.";
    }
  }
}

export default OpenClaw;
