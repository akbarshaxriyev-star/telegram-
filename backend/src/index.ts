import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import telegramRoutes from "./routes/telegram.routes";
import settingsRoutes from "./routes/settings.routes";
import prisma from "./prisma";
import { TelegramService } from "./services/telegram.service";

import path from "path";
import { fileURLToPath } from "url";

// In-memory logger for debugging Render
const logs: string[] = [];
const originalLog = console.log;
const originalError = console.error;
console.log = (...args) => {
  const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
  logs.push(`[INFO] ${new Date().toISOString()} - ${msg}`);
  if (logs.length > 200) logs.shift();
  originalLog(...args);
};
console.error = (...args) => {
  const msg = args.map(a => {
    if (a instanceof Error) return a.stack || a.message;
    if (typeof a === 'object') {
      try { return JSON.stringify(a); } catch (e) { return String(a); }
    }
    return a;
  }).join(' ');
  logs.push(`[ERROR] ${new Date().toISOString()} - ${msg}`);
  if (logs.length > 200) logs.shift();
  originalError(...args);
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

app.get('/api/logs', (req, res) => {
  res.json({ logs });
});

let socketIoInstance: Server | null = null;

export const getSocketIO = () => socketIoInstance;

io.on("connection", (socket) => {
  console.log("Client connected", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

socketIoInstance = io;

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/telegram", telegramRoutes);
app.use("/api/settings", settingsRoutes);

// Serve frontend static files
const frontendDist = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendDist));
app.use((req: express.Request, res: express.Response) => {
  const indexPath = path.join(frontendDist, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).json({ status: "API running" });
    }
  });
});

const PORT = process.env.PORT || 5000;

// Initialize clients on startup
async function initClients() {
  const users = await prisma.user.findMany({
    where: { sessionString: { not: null } }
  });
  
  for (const user of users) {
    if (user.sessionString) {
      try {
        await TelegramService.startClient(user.id, user.sessionString);
      } catch (err) {
        console.error(`Failed to start client for user ${user.id}`, err);
      }
    }
  }
}

server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initClients();
});
