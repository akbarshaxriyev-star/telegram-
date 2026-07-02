import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import prisma from "../prisma";
import { AIService } from "./ai.service";
import { NewMessage, NewMessageEvent } from "telegram/events";
import { getSocketIO } from "../index";

const apiId = parseInt(process.env.API_ID || "0");
const apiHash = process.env.API_HASH || "";

export const clients: Record<number, TelegramClient> = {};
export const tempClients: Record<string, TelegramClient> = {};

export class TelegramService {
  static async startClient(userId: number, sessionString: string) {
    if (clients[userId]) return clients[userId];

    const stringSession = new StringSession(sessionString);
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    await client.connect();
    const isAuth = await client.checkAuthorization();
    console.log(`Telegram client started for user ${userId}. Authorized:`, isAuth);

    if (isAuth) {
      const me = await client.getMe();
      console.log(`Logged in as: ${(me as any).firstName} (${(me as any).phone})`);
    }

    client.addEventHandler(async (event: NewMessageEvent) => {
      await TelegramService.handleNewMessage(userId, client, event);
    }, new NewMessage({}));

    clients[userId] = client;
    console.log(`Telegram client started for user ${userId}`);
    return client;
  }

  static async handleNewMessage(userId: number, client: TelegramClient, event: NewMessageEvent) {
    try {
      const message = event.message;
      console.log("================================");
      console.log("New message event triggered!");
      console.log("Text:", message.text);
      console.log("IsPrivate:", message.isPrivate, "Outgoing:", message.out);
      
      if (!message.isPrivate) {
         console.log("Ignored because it's not private");
         return;
      }
      if (message.out) {
         console.log("Ignored because it's outgoing");
         return; 
      }

      const senderId = message.senderId?.toString() || "";
      const chatId = message.chatId?.toString() || "";
      const text = message.text;

      if (!text) {
         console.log("Ignored because no text");
         return;
      }

      console.log(`Processing message from ${senderId} in chat ${chatId}`);

    const settings = await prisma.aiSettings.findUnique({ where: { userId } });
    console.log("AI Settings found:", settings);
    if (!settings || !settings.enabled) return;

    await prisma.messageHistory.create({
      data: {
        userId,
        chatId,
        senderId,
        message: text,
        isFromMe: false,
      }
    });

    const replyText = await AIService.generateReply(userId, chatId, text);
    console.log("Generated AI reply:", replyText);
    
    if (replyText) {
      const delay = Math.floor(Math.random() * (settings.typingDelayMax - settings.typingDelayMin + 1) + settings.typingDelayMin) * 1000;

      const io = getSocketIO();
      if(io) io.emit("ai_typing", { userId, chatId });

      try {
        await client.invoke(new Api.messages.SetTyping({
          peer: message.chatId,
          action: new Api.SendMessageTypingAction()
        }));
      } catch (err) {
        console.error("Failed to set typing status:", err);
      }

      setTimeout(async () => {
        try {
          await client.sendMessage(message.chatId, { message: replyText });
          await prisma.messageHistory.create({
            data: {
              userId,
              chatId,
              senderId: "me",
              message: replyText,
              isFromMe: true,
            }
          });
          if(io) io.emit("ai_replied", { userId, chatId, text: replyText });
        } catch (e) {
          console.error("Failed to send message:", e);
        }
      }, delay);
    }
    } catch (e) {
      console.error("Error in handleNewMessage:", e);
    }
  }

  static async sendCode(phone: string) {
    const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
      connectionRetries: 5,
    });
    await client.connect();
    const result = await client.sendCode({
      apiId,
      apiHash,
    }, phone);
    
    // Store temp client for later verification
    tempClients[phone] = client;
    
    return { phoneCodeHash: result.phoneCodeHash };
  }
}
