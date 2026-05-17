/**
 * CheckMate Arena — Custom server
 * Runs Next.js and Socket.io together on one port.
 *
 * Usage:
 *   node server.js              # production
 *   NODE_ENV=development node server.js  # dev with hot reload
 */

const { createServer } = require('http');
const { Server } = require('socket.io');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-memory room state
// roomCode -> { players: [{ socketId, username, color }], gameState: any }
const rooms = new Map();

function normalizeRoomCode(roomCode) {
  if (typeof roomCode !== 'string') return null;
  const code = roomCode.trim().toUpperCase();
  return /^[A-Z2-9]{6}$/.test(code) ? code : null;
}

function normalizeUsername(username) {
  if (typeof username !== 'string') return null;
  const name = username.trim().slice(0, 20);
  return name ? name : null;
}

function isPosition(value) {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    Number.isInteger(value[0]) &&
    Number.isInteger(value[1]) &&
    value[0] >= 0 &&
    value[0] < 8 &&
    value[1] >= 0 &&
    value[1] < 8
  );
}

function isMovePayload(move) {
  return (
    move &&
    typeof move === 'object' &&
    isPosition(move.from) &&
    isPosition(move.to) &&
    Array.isArray(move.captures) &&
    move.captures.every(isPosition)
  );
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  const io = new Server(httpServer, {
    path: '/api/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    socket.on('join-room', ({ roomCode, username }) => {
      const code = normalizeRoomCode(roomCode);
      const name = normalizeUsername(username);
      if (!code || !name) {
        socket.emit('room-error', { message: 'Invalid room or username' });
        return;
      }

      const room = rooms.get(code);

      if (!room) {
        // First player — they are red
        socket.join(code);
        rooms.set(code, {
          players: [{ socketId: socket.id, username: name, color: 'red' }],
          currentTurn: 'red',
        });

        socket.emit('room-joined', { color: 'red' });
        console.log(`[Room] ${name} created room ${code} as RED`);
      } else {
        // Check if this player is reconnecting
        const existing = room.players.find(p => p.username === name);
        if (existing) {
          socket.join(code);
          existing.socketId = socket.id;
          const opponent = room.players.find(p => p.username !== name);
          socket.emit('room-joined', {
            color: existing.color,
            opponentName: opponent?.username,
          });
          console.log(`[Room] ${name} reconnected to room ${code}`);
          return;
        }

        if (room.players.length >= 2) {
          socket.emit('room-full', { message: 'Room is full' });
          return;
        }

        socket.join(code);

        // Second player — they are black
        room.players.push({ socketId: socket.id, username: name, color: 'black' });
        room.currentTurn = 'red';

        const firstPlayer = room.players[0];

        // Notify second player
        socket.emit('room-joined', {
          color: 'black',
          opponentName: firstPlayer.username,
        });

        // Notify first player that opponent joined
        io.to(firstPlayer.socketId).emit('opponent-joined', { username: name });

        console.log(`[Room] ${name} joined room ${code} as BLACK`);
      }
    });

    socket.on('make-move', ({ roomCode, move }) => {
      const code = normalizeRoomCode(roomCode);
      if (!code || !isMovePayload(move)) return;

      const room = rooms.get(code);
      if (!room) return;

      // Reject if sender is not in this room
      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) return;

      // Reject if it's not this player's turn
      if (player.color !== room.currentTurn) return;

      // Broadcast move to opponent and advance turn
      socket.to(code).emit('move-made', move);
      room.currentTurn = room.currentTurn === 'red' ? 'black' : 'red';
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);

      // Find which room this socket was in and notify opponent
      for (const [code, room] of rooms.entries()) {
        const playerIdx = room.players.findIndex(p => p.socketId === socket.id);
        if (playerIdx !== -1) {
          const disconnected = room.players[playerIdx];
          console.log(`[Room] ${disconnected.username} left room ${code}`);

          // Notify opponents
          socket.to(code).emit('opponent-disconnected', {
            username: disconnected.username,
          });

          // Remove player from room
          room.players.splice(playerIdx, 1);

          // Clean up empty rooms
          if (room.players.length === 0) {
            rooms.delete(code);
            console.log(`[Room] Room ${code} deleted (empty)`);
          }
          break;
        }
      }
    });

    // Chat (bonus feature)
    socket.on('send-message', ({ roomCode, message, username }) => {
      const code = normalizeRoomCode(roomCode);
      const name = normalizeUsername(username);
      if (!code || typeof message !== 'string' || !name) return;
      const cleanMessage = message.trim().slice(0, 500);
      if (!cleanMessage) return;

      const room = rooms.get(code);
      const player = room?.players.find(p => p.socketId === socket.id);
      if (!player) return;

      io.to(code).emit('chat-message', { username: name, message: cleanMessage, time: Date.now() });
    });
  });

  httpServer.listen(port, () => {
    console.log(`\n╔═══════════════════════════════════════════╗`);
    console.log(`║       CheckMate Arena Server               ║`);
    console.log(`╠═══════════════════════════════════════════╣`);
    console.log(`║  Next.js + Socket.io on port ${port}          ║`);
    console.log(`║  http://${hostname}:${port}                      ║`);
    console.log(`║  Mode: ${dev ? 'development' : 'production  '}                   ║`);
    console.log(`╚═══════════════════════════════════════════╝\n`);
  });
});
