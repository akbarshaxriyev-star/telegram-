import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "../prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

      let modelName = settings.gptModel || "gemini-2.5-flash";
      if (modelName === "gemini-1.5-pro") modelName = "gemini-2.5-flash"; // auto migrate unsupported model

      const model = genAI.getGenerativeModel({ model: modelName });
      
      const history = await prisma.messageHistory.findMany({
        where: { userId, chatId },
        orderBy: { createdAt: 'desc' },
        take: settings.maxMemory
      });

      // format history
      const formattedHistory = history.reverse().map(msg => {
        return `${msg.isFromMe ? 'Me' : 'User'}: ${msg.message}`;
      }).join('\n');

      const systemPrompt = rule?.customPrompt || settings.systemPrompt;

      const prompt = `
System Prompt: ${systemPrompt}

Conversation History:
${formattedHistory}

User: ${incomingMessage}
Me:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("AI Error:", error);
      return null;
    }
  }
}
