const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

io.on('connection', (socket) => {
  console.log('🟢 New client connected:', socket.id);

  socket.on('join-room', ({ roomId }) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    const numUsers = room ? room.size : 0;

    if (numUsers >= 2) {
      console.log(`❌ Room ${roomId} full. Rejecting ${socket.id}`);
      socket.emit('join-error', 'Room is full');
      socket.disconnect(true);
      return;
    }

    socket.join(roomId);
    console.log(`🧑 ${socket.id} joined room ${roomId}`);

    // System message to all clients in room
    socket.to(roomId).emit('system-message', `✅ ${socket.id} joined the room`);
    socket.emit('system-message', `🟢 ${socket.id} created the room`);

    
  
  });

socket.on('send-public-key', ({ roomId, publicKey }) => {
  console.log(`🔄 Relaying public key from ${socket.id} to room ${roomId}`);
  socket.to(roomId).emit('receive-public-key', {
    publicKey,
    theirSocketId: socket.id
  });
});

  socket.on('send-message', ({ roomId, encrypted, nonce }) => {
    socket.to(roomId).emit('receive-message', { encrypted, nonce });
  });

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        socket.to(roomId).emit('system-message', `❌ ${socket.id} left the room`);
        console.log(`🔴 ${socket.id} left room ${roomId}`);

        const room = io.sockets.adapter.rooms.get(roomId);
        if (!room || room.size === 0) {
          console.log(`💣 No users left in room ${roomId}`);
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

