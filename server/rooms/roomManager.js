const rooms = {};

function joinRoom(roomId, socketId) {
  if (!rooms[roomId]) rooms[roomId] = [];

  if (rooms[roomId].length >= 2) {
    return { error: 'Room is full' };
  }

  rooms[roomId].push(socketId);
  return { users: rooms[roomId] };
}

function leaveRoom(socketId) {
  for (const [roomId, users] of Object.entries(rooms)) {
    const index = users.indexOf(socketId);
    if (index !== -1) {
      users.splice(index, 1);
      if (users.length === 0) delete rooms[roomId];
      return roomId;
    }
  }
  return null;
}

// ✅ ADD THIS:
function getUsers(roomId) {
  return rooms[roomId] || [];
}

module.exports = {
  joinRoom,
  leaveRoom,
  getUsers  // ✅ export it here
};
