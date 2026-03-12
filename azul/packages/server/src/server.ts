import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerSocketEvents } from './socketEvents';

const app = express();
const httpServer = createServer(app);
const allowedOrigins = (process.env.ALLOWED_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// CORS 配置
app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  })
);

app.use(express.json());

// Socket.IO 初始化
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

// 注册 Socket 事件
registerSocketEvents(io);

// 健康检查接口
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[Azul Server] 服务已启动，端口: ${PORT}`);
  console.log(`[Azul Server] WebSocket 已就绪`);
});

export { io };
