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
      if (!roomCode || !username) return;

      const code = roomCode.toUpperCase();
      socket.join(code);

      if (!rooms.has(code)) {
        // First player — they are red
        rooms.set(code, {
          players: [{ socketId: socket.id, username, color: 'red' }],
        });

        socket.emit('room-joined', { color: 'red' });
        console.log(`[Room] ${username} created room ${code} as RED`);
      } else {
        const room = rooms.get(code);

        // Check if this player is reconnecting
        const existing = room.players.find(p => p.username === username);
        if (existing) {
          existing.socketId = socket.id;
          const opponent = room.players.find(p => p.username !== username);
          socket.emit('room-joined', {
            color: existing.color,
            opponentName: opponent?.username,
          });
          console.log(`[Room] ${username} reconnected to room ${code}`);
          return;
        }

        if (room.players.length >= 2) {
          socket.emit('room-full', { message: 'Room is full' });
          return;
        }

        // Second player — they are black
        room.players.push({ socketId: socket.id, username, color: 'black' });

        const firstPlayer = room.players[0];

        // Notify second player
        socket.emit('room-joined', {
          color: 'black',
          opponentName: firstPlayer.username,
        });

        // Notify first player that opponent joined
        io.to(firstPlayer.socketId).emit('opponent-joined', { username });

        console.log(`[Room] ${username} joined room ${code} as BLACK`);
      }
    });

    socket.on('make-move', ({ roomCode, move }) => {
      if (!roomCode || !move) return;
      const code = roomCode.toUpperCase();

      // Broadcast move to other players in room
      socket.to(code).emit('move-made', move);
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
      if (!roomCode || !message) return;
      io.to(roomCode.toUpperCase()).emit('chat-message', { username, message, time: Date.now() });
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
