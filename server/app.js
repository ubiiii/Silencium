const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const roomManager = require('./rooms/roomManager');


const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // Replace with your frontend origin in production
    methods: ['GET', 'POST'],
  }
});

app.use(cors());

app.get('/', (req, res) => res.send('Silencium server running'));

io.on('connection', socket => {
  console.log('🟢 New client connected:', socket.id);

  socket.on('join-room', ({ roomId }) => {
    if (!roomId || typeof roomId !== 'string') {
      console.warn(`❌ Invalid roomId:`, roomId);
      socket.emit('join-error', 'Invalid room ID');
      return;
    }

    const result = roomManager.joinRoom(roomId, socket.id);

    if (result.error) {
      console.log(`❌ Join failed: ${result.error}`);
      socket.emit('join-error', result.error);
      return;
    }

    socket.join(roomId);
    console.log(`🧑 ${socket.id} joined room ${roomId}`);
    console.log(`👥 Users in room ${roomId}:`, result.users);

    // Delay message emit slightly to ensure everyone is joined
    setTimeout(() => {
      const msg = result.users.length === 1
        ? `🟢 ${socket.id} created the room`
        : `✅ ${socket.id} joined the room`;

      io.to(roomId).emit('system-message', msg);
      console.log('📢 system-message:', msg);
    }, 100);

    io.to(roomId).emit('room-update', result.users);

    if (result.users.length === 2) {
      io.to(roomId).emit('start-chat');
    }
  });

  socket.on('send-message', ({ roomId, encrypted, nonce }) => {
    if (!roomId || !encrypted || !nonce) return;
    socket.to(roomId).emit('receive-message', { encrypted, nonce });
  });

  socket.on('send-public-key', ({ roomId, publicKey }) => {
    console.log(`🔄 Relaying public key from ${socket.id} to room ${roomId}`);
    socket.to(roomId).emit('receive-public-key', {
      publicKey,
      theirSocketId: socket.id,
    });
  });




  socket.on('disconnect', () => {
    const roomId = roomManager.leaveRoom(socket.id);

    if (roomId) {
      const msg = `❌ ${socket.id} left the room`;
      io.to(roomId).emit('system-message', msg);
      const room = io.sockets.adapter.rooms.get(roomId);

      if (!room || room.size === 0) {
        console.log(`💣 No users left in room ${roomId}`);
      } else {
        io.to(roomId).emit('user-left', socket.id);
      }

      console.log('📢 system-message:', msg);
      console.log(`🔴 ${socket.id} left room ${roomId}`);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Silencium WebSocket server running on http://localhost:${PORT}`);
});
