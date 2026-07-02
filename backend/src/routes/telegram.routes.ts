import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma";
import { TelegramService, tempClients } from "../services/telegram.service";

const router = Router();

// Auth Middleware inline for now
const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as { id: number };
    (req as any).userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

router.post("/send-code", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const { phone } = req.body;
    const result = await TelegramService.sendCode(phone);
    res.json({ phoneCodeHash: result.phoneCodeHash });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/verify-code", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const { phone, phoneCodeHash, code, password } = req.body;
    const userId = (req as any).userId;
    const client = tempClients[phone];

    if (!client) return res.status(400).json({ error: "Session expired, please resend code." });

    await client.signInUser(
      { apiId: parseInt(process.env.API_ID || "0"), apiHash: process.env.API_HASH || "" },
      { 
        phoneNumber: phone, 
        phoneCode: async () => code, 
        password: async () => {
          if (!password) throw new Error("2FA password required");
          return password;
        },
        onError: (err: Error) => { console.error(err); } 
      }
    );

    const sessionString = client.session.save() as unknown as string;
    
    // Save to user
    await prisma.user.update({
      where: { id: userId },
      data: { sessionString }
    });

    // Start listening
    await TelegramService.startClient(userId, sessionString);

    delete tempClients[phone];
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
