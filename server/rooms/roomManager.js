const rooms = {};

function joinRoom(roomId, socketId) {
  if (!rooms[roomId]) rooms[roomId] = { users: new Set() };

  const room = rooms[roomId];
  if (!room.users.has(socketId) && room.users.size >= 2) {
    return { error: 'Room is full' };
  }

  room.users.add(socketId);
  return { users: Array.from(room.users) };
}

function leaveRoom(socketId) {
  for (const [roomId, room] of Object.entries(rooms)) {
    if (room.users.has(socketId)) {
      room.users.delete(socketId);
      if (room.users.size === 0) delete rooms[roomId];
      return roomId;
    }
  }
  return null;
}

module.exports = { joinRoom, leaveRoom };
