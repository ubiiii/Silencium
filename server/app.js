const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const roomManager = require('./rooms/roomManager');

// Development logging helper
const isDev = process.env.NODE_ENV !== 'production';
const devLog = (...args) => {
  if (isDev) {
    console.log(...args);
  }
};

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  maxHttpBufferSize: 3 * 1024 * 1024  // 3 MB to handle compressed images safely
});


app.use(cors());
app.get('/', (req, res) => res.send('Silencium server running'));

const roomCountdowns = {}; // roomId => { startTime, timeout }

io.on('connection', (socket) => {
  devLog('🟢 New client connected:', socket.id);

  // 🏠 JOIN ROOM
  socket.on('join-room', ({ roomId }) => {
    if (!roomId || typeof roomId !== 'string') {
      socket.emit('join-error', 'Invalid room ID');
      return;
    }

    // Check if user is already in a room
    if (socket.data.roomId && socket.data.roomId !== roomId) {
      // Leave previous room first
      const prevRoomId = socket.data.roomId;
      const prevRoomUsers = roomManager.getUsers(prevRoomId);
      const userIndex = prevRoomUsers.indexOf(socket.id);
      if (userIndex !== -1) {
        prevRoomUsers.splice(userIndex, 1);
        if (prevRoomUsers.length === 0) {
          delete rooms[prevRoomId];
        }
      }
    }

    const result = roomManager.joinRoom(roomId, socket.id);

    if (result.error) {
      socket.emit('join-error', result.error);
      return;
    }

    socket.join(roomId);
    socket.data.roomId = roomId;

    devLog(`🧑 ${socket.id} joined room ${roomId}`);
    devLog(`👥 Users in room ${roomId}:`, result.users);

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
      if (!data.image?.startsWith('data:image/') || Buffer.byteLength(data.image, 'utf-8') > 3 * 1024 * 1024) {
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

  // 🔐 ENCRYPTED IMAGE MESSAGE HANDLER
  socket.on('send-encrypted-image', (data) => {
    const roomId = data.roomId || socket.data.roomId;
    if (!roomId || !data.encrypted || !data.nonce) {
      console.warn(`❌ Invalid encrypted image data from ${socket.id}`);
      return;
    }

    try {
      devLog(`📤 Processing encrypted image from ${socket.id} in room ${roomId}`);
      devLog(`📊 Image size: ${data.encrypted.length} bytes`);

      const messagePayload = {
        encrypted: data.encrypted,
        nonce: data.nonce,
        name: data.name,
        type: data.type,
      };

      // send encrypted image to other users in the room
      socket.to(roomId).emit('receive-encrypted-image', messagePayload);
      devLog(`✅ Encrypted image sent to room ${roomId}`);
    } catch (error) {
      console.error(`❌ Error processing encrypted image from ${socket.id}:`, error);
    }
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
    devLog(`⏱️ Inactivity countdown started in room ${roomId}`);

    const timeout = setTimeout(() => {
      devLog(`💥 Room ${roomId} destroyed due to inactivity`);
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
    devLog(`🔄 Inactivity countdown cancelled in room ${roomId}`);
    io.to(roomId).emit('cancel-inactivity-countdown');
  });

  // 🚪 LEAVE ROOM
  socket.on('leave-room', ({ roomId }) => {
    devLog(`🚪 ${socket.id} manually left room ${roomId}`);
    
    // Remove user from room
    const actualRoomId = roomId || socket.data.roomId;
    if (actualRoomId) {
      const users = roomManager.getUsers(actualRoomId);
      const userIndex = users.indexOf(socket.id);
      if (userIndex !== -1) {
        users.splice(userIndex, 1);
        
        if (users.length === 0) {
          // No users left, delete the room
          roomManager.deleteRoom(actualRoomId);
          if (roomCountdowns[actualRoomId]) {
            clearTimeout(roomCountdowns[actualRoomId].timeout);
            delete roomCountdowns[actualRoomId];
          }
        } else {
          // Notify remaining users and destroy the room
          devLog(`💥 Room ${actualRoomId} destroyed because user ${socket.id} left`);
          io.to(actualRoomId).emit('room-destroyed', {
            message: 'A user left the room. Room has been destroyed.',
            leftUserId: socket.id
          });
          // Remove all users from the room
          io.in(actualRoomId).socketsLeave(actualRoomId);
          // Clear the room
          roomManager.deleteRoom(actualRoomId);
          if (roomCountdowns[actualRoomId]) {
            clearTimeout(roomCountdowns[actualRoomId].timeout);
            delete roomCountdowns[actualRoomId];
          }
        }
      }
    }
  });

  // ❌ DISCONNECT
  socket.on('disconnect', (reason) => {
  devLog(`🔴 ${socket.id} disconnected due to: ${reason}`);

  // Add a grace period for reconnection (5 seconds)
  setTimeout(() => {
    const roomId = roomManager.leaveRoom(socket.id);
    if (roomId) {
      const msg = `❌ ${socket.id} left the room`;
      io.to(roomId).emit('system-message', msg);

      const users = roomManager.getUsers(roomId);
      io.to(roomId).emit('room-update', users);

      if (users.length === 0) {
        devLog(`💣 No users left in room ${roomId}`);
        if (roomCountdowns[roomId]) {
          clearTimeout(roomCountdowns[roomId].timeout);
          delete roomCountdowns[roomId];
        }
      } else {
        // Notify remaining users that someone left and destroy the room
        devLog(`💥 Room ${roomId} destroyed because user ${socket.id} left`);
        io.to(roomId).emit('room-destroyed', {
          message: 'A user left the room. Room has been destroyed.',
          leftUserId: socket.id
        });
        // Remove all users from the room
        io.in(roomId).socketsLeave(roomId);
        // Clear the room
        roomManager.deleteRoom(roomId);
        if (roomCountdowns[roomId]) {
          clearTimeout(roomCountdowns[roomId].timeout);
          delete roomCountdowns[roomId];
        }
      }

      devLog(`🔴 ${socket.id} left room ${roomId}`);
    }
  }, 5000); // 5 second grace period
});
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  devLog(`🚀 Silencium server running at http://localhost:${PORT}`);
});