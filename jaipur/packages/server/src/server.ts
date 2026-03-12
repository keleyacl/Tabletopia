// ============================================================
// 斋浦尔 - 服务器入口
// ============================================================

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerSocketEvents } from './socketEvents';

const app = express();
const httpServer = createServer(app);
const allowedOrigins = (process.env.ALLOWED_ORIGIN || 'http://localhost:3006')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  })
);
app.use(express.json());

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', game: 'Jaipur' });
});

// 设置 Socket 事件
registerSocketEvents(io);

const PORT = process.env.PORT || 3007;

httpServer.listen(PORT, () => {
  console.log(`[Jaipur Server] 运行在端口 ${PORT}`);
});
