import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma";

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

router.get("/", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).userId;
    let settings = await prisma.aiSettings.findUnique({ where: { userId } });
    if (!settings) {
      settings = await prisma.aiSettings.create({
        data: { userId, enabled: true, gptModel: 'gemini-2.5-flash' }
      });
    }
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).userId;
    const data = req.body;
    
    // allow updating specific fields
    const updated = await prisma.aiSettings.upsert({
      where: { userId },
      update: {
        enabled: data.enabled !== undefined ? data.enabled : undefined,
        systemPrompt: data.systemPrompt,
        gptModel: data.gptModel,
        typingDelayMin: data.typingDelayMin ? parseInt(data.typingDelayMin) : undefined,
        typingDelayMax: data.typingDelayMax ? parseInt(data.typingDelayMax) : undefined,
      },
      create: {
        userId,
        enabled: data.enabled !== undefined ? data.enabled : true,
        systemPrompt: data.systemPrompt || "",
        gptModel: data.gptModel || "gemini-2.5-flash",
        typingDelayMin: data.typingDelayMin ? parseInt(data.typingDelayMin) : 2,
        typingDelayMax: data.typingDelayMax ? parseInt(data.typingDelayMax) : 10,
      }
    });

    res.json({ success: true, settings: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
// Test Gemini AI
router.post("/test-ai", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).userId;
    const settings = await prisma.aiSettings.findUnique({ where: { userId } });
    if (!settings) { res.status(400).json({ error: "Sozlamalar topilmadi" }); return; }

    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: settings.gptModel || "gemini-1.5-pro" });
    
    const result = await model.generateContent("Salom, qandaysan? Qisqa javob ber.");
    const response = await result.response;
    res.json({ success: true, text: response.text() });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || error.toString() });
  }
});

export default router;
