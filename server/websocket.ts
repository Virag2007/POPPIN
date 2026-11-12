import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";

const PORT = parseInt(process.env.WS_PORT || "3001", 10);

// Map of roomId -> Set of WebSocket clients
const rooms = new Map<string, Set<WebSocket>>();
// Map of client -> Set of roomIds joined
const clientRooms = new Map<WebSocket, Set<string>>();

const server = http.createServer((req, res) => {
  // Allow internal HTTP broadcast from Next.js server actions / API routes
  if (req.method === "POST" && req.url === "/broadcast") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const { room, event, payload } = JSON.parse(body);
        broadcastToRoom(room, event, payload);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  // Health check
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", activeRooms: rooms.size }));
    return;
  }

  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });

function broadcastToRoom(
  room: string,
  event: string,
  payload: unknown,
  excludeClient?: WebSocket
) {
  const clients = rooms.get(room);
  if (!clients) return;

  const message = JSON.stringify({ event, payload });
  for (const client of clients) {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

wss.on("connection", (ws: WebSocket) => {
  clientRooms.set(ws, new Set());

  ws.on("message", (raw: string) => {
    try {
      const data = JSON.parse(raw.toString());
      const { event, payload } = data;

      if (event === "conversation:join" && payload?.conversationId) {
        const roomId = payload.conversationId;
        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Set());
        }
        rooms.get(roomId)!.add(ws);
        clientRooms.get(ws)?.add(roomId);
      } else if (event === "conversation:leave" && payload?.conversationId) {
        const roomId = payload.conversationId;
        rooms.get(roomId)?.delete(ws);
        clientRooms.get(ws)?.delete(roomId);
      } else if (event === "typing:start" && payload?.conversationId) {
        // Relay typing event to other members in the room
        broadcastToRoom(payload.conversationId, "typing:start", payload, ws);
      } else if (event === "typing:stop" && payload?.conversationId) {
        // Relay stop typing event to other members in the room
        broadcastToRoom(payload.conversationId, "typing:stop", payload, ws);
      } else if (event === "message:new" && payload?.conversationId) {
        broadcastToRoom(payload.conversationId, "message:new", payload);
      }
    } catch (err) {
      console.error("[WebSocket] Parse error:", err);
    }
  });

  ws.on("close", () => {
    const joined = clientRooms.get(ws);
    if (joined) {
      for (const roomId of joined) {
        rooms.get(roomId)?.delete(ws);
        if (rooms.get(roomId)?.size === 0) {
          rooms.delete(roomId);
        }
      }
      clientRooms.delete(ws);
    }
  });

  ws.on("error", (err) => {
    console.error("[WebSocket] Client error:", err);
  });
});

server.listen(PORT, () => {
  console.log(`[POPPIN Real-Time WebSocket Server] Listening on port ${PORT}`);
});

