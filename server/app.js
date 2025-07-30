const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const roomManager = require('./rooms/roomManager');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  maxHttpBufferSize: 7 * 1024 * 1024  //  ~7 MB to safely support base64 of 5MB
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

  // 🖼️ IMAGE MESSAGE HANDLER (moved outside join-room)
  socket.on('image-message', (data) => {
      const roomId = data.roomId || socket.data.roomId;
      if (!data.image?.startsWith('data:image/') || Buffer.byteLength(data.image, 'utf-8') > 7 * 1024 * 1024) {
        console.warn(`❌ Blocked oversized or invalid image from ${socket.id}`);
        return;
      }

      if (!roomId || !data.image) return;

      const timestamp = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });

      const messagePayload = {
        image: data.image,
        name: data.name,
        type: data.type,
        sender: socket.id,
        timestamp
      };

      // send to everyone (sender + receiver)
      io.to(roomId).emit('receive-image', messagePayload);
    });



  // 🔐 PUBLIC KEY RELAY
  socket.on('send-public-key', ({ roomId, publicKey }) => {
    if (!roomId || !publicKey) return;
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
    }, 10 * 60 * 1000); // 10 minutes

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
  socket.on('disconnect', (reason) => {
  console.log(`🔴 ${socket.id} disconnected due to: ${reason}`);

  const roomId = roomManager.leaveRoom(socket.id);
  if (roomId) {
    const msg = `❌ ${socket.id} left the room`;
    io.to(roomId).emit('system-message', msg);

    const users = roomManager.getUsers(roomId);
    io.to(roomId).emit('room-update', users);

    if (users.length === 0) {
      console.log(`💣 No users left in room ${roomId}`);
      if (roomCountdowns[roomId]) {
        clearTimeout(roomCountdowns[roomId].timeout);
        delete roomCountdowns[roomId];
      }
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