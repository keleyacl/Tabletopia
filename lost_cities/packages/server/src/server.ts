// ============================================================
// 失落的城市 - 服务器入口
// ============================================================

import { WebSocketServer } from 'ws';
import { setupSocketEvents } from './socketEvents.js';

const PORT = Number(process.env.PORT) || 3005;
const wss = new WebSocketServer({ port: PORT });

// 设置 Socket 事件
setupSocketEvents(wss);

console.log(`[Lost Cities Server] 运行在端口 ${PORT}`);
