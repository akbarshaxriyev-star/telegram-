import Groq from "groq-sdk";
import prisma from "../prisma";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

export class AIService {
  static async generateReply(userId: number, chatId: string, incomingMessage: string): Promise<string | null> {
    try {
      const settings = await prisma.aiSettings.findUnique({ where: { userId } });
      if (!settings || !settings.enabled) return null;

      // check contact rules
      const rule = await prisma.contactRule.findUnique({
        where: { userId_telegramId: { userId, telegramId: chatId } }
      });

      if (rule && rule.type === "BLACKLIST") return null;
      if (rule && rule.type === "DISABLED") return null;

      let modelName = settings.gptModel || "llama-3.3-70b-versatile";
      // Auto-migrate: if model is a Gemini model, switch to Llama (Groq doesn't support Gemini)
      if (!modelName || modelName.includes("gemini") || modelName.includes("gpt")) {
        modelName = "llama-3.3-70b-versatile";
      }

      const history = await prisma.messageHistory.findMany({
        where: { userId, chatId },
        orderBy: { createdAt: 'desc' },
        take: settings.maxMemory
      });

      // format history as messages
      const systemPrompt = rule?.customPrompt || settings.systemPrompt;
      const messages: { role: "user" | "assistant"; content: string }[] = [];

      history.reverse().forEach(msg => {
        messages.push({
          role: msg.isFromMe ? "assistant" : "user",
          content: msg.message
        });
      });

      messages.push({ role: "user", content: incomingMessage });

      const completion = await groq.chat.completions.create({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature: settings.temperature || 0.7,
        max_tokens: 500,
      });

      return completion.choices[0]?.message?.content || null;
    } catch (error) {
      console.error("AI Error:", error);
      return null;
    }
  }
}
