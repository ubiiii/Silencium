const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const roomManager = require('./rooms/roomManager');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.get('/', (req, res) => res.send('Silencium server running'));

const roomCountdowns = {}; // roomId => { startTime, timeout }

io.on('connection', (socket) => {
  console.log('🟢 New client connected:', socket.id);

  // 🏠 JOIN ROOM
  socket.on('join-room', ({ roomId }) => {
    if (!roomId || typeof roomId !== 'string') {
      socket.emit('join-error', 'Invalid room ID');
      return;
    }

    const result = roomManager.joinRoom(roomId, socket.id);

    if (result.error) {
      socket.emit('join-error', result.error);
      return;
    }

    socket.join(roomId);
    socket.data.roomId = roomId;

    console.log(`🧑 ${socket.id} joined room ${roomId}`);
    console.log(`👥 Users in room ${roomId}:`, result.users);

    const msg = result.users.length === 1
      ? `🟢 ${socket.id} created the room`
      : `✅ ${socket.id} joined the room`;

    setTimeout(() => {
      io.to(roomId).emit('system-message', msg);
      io.to(roomId).emit('room-update', result.users);
      if (result.users.length === 2) {
        io.to(roomId).emit('start-chat');
      }
    }, 100);
  });

  // 🔐 PUBLIC KEY RELAY
  socket.on('send-public-key', ({ roomId, publicKey }) => {
    socket.to(roomId).emit('receive-public-key', {
      publicKey,
      theirSocketId: socket.id
    });
  });

  // 🔐 MESSAGE RELAY
  socket.on('send-message', ({ roomId, encrypted, nonce }) => {
    if (!roomId || !encrypted || !nonce) return;
    socket.to(roomId).emit('receive-message', { encrypted, nonce });
  });

  // ⏳ START INACTIVITY COUNTDOWN
  socket.on('startInactivityCountdown', () => {
    const roomId = socket.data.roomId;
    if (!roomId || roomCountdowns[roomId]) return;

    const startTime = Date.now();
    console.log(`⏱️ Inactivity countdown started in room ${roomId}`);

    const timeout = setTimeout(() => {
      console.log(`💥 Room ${roomId} destroyed due to inactivity`);
      io.to(roomId).emit('roomDestructed', '⚠️ Room destroyed due to user inactivity.');
      io.in(roomId).socketsLeave(roomId);
      delete roomCountdowns[roomId];
    }, 10 * 60 * 1000);

    roomCountdowns[roomId] = { startTime, timeout };
    io.to(roomId).emit('start-inactivity-countdown', { startTime });
  });

  // 🔁 CANCEL INACTIVITY COUNTDOWN
  socket.on('cancelInactivityCountdown', () => {
    const roomId = socket.data.roomId;
    if (!roomId || !roomCountdowns[roomId]) return;

    clearTimeout(roomCountdowns[roomId].timeout);
    delete roomCountdowns[roomId];
    console.log(`🔄 Inactivity countdown cancelled in room ${roomId}`);
    io.to(roomId).emit('cancel-inactivity-countdown');
  });

  // ❌ DISCONNECT
  socket.on('disconnect', () => {
    const roomId = roomManager.leaveRoom(socket.id);
    if (roomId) {
      const msg = `❌ ${socket.id} left the room`;
      io.to(roomId).emit('system-message', msg);

      const users = roomManager.getUsers(roomId);
      if (!users.length) {
        console.log(`💣 No users left in room ${roomId}`);
      } else {
        io.to(roomId).emit('user-left', socket.id);
      }

      console.log(`🔴 ${socket.id} left room ${roomId}`);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Silencium server running at http://localhost:${PORT}`);
});
