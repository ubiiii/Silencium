import React, { useEffect, useState } from 'react';
import { socket } from '../utils/socket';
import { useLocation } from 'react-router-dom';

export default function JoinRoom() {
  const [roomKey, setRoomKey] = useState('');
  const location = useLocation(); // ✅ moved inside the component
  const params = new URLSearchParams(location.search);
  const roomId = params.get('room');

  useEffect(() => {
    socket.emit('join-room', { roomId });

    socket.on('receive-message', (encrypted) => {
      // If you're not using messages here, this can be removed or added later
      console.log('Received message (encrypted):', encrypted);
    });

    socket.on('join-error', (errorMsg) => {
      alert(`⚠️ Could not join room: ${errorMsg}`);
      window.location.href = '/';
    });

    return () => {
      socket.off('receive-message');
      socket.off('join-error');
    };
  }, [roomId]);

  const handleJoin = () => {
    window.location.href = `/chat?room=${roomKey}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 text-center bg-gray-100">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">🔐 Join Silencium Room</h1>
      <p className="text-gray-600 mb-4">Paste the room key or link</p>

      <input
        type="text"
        value={roomKey}
        onChange={(e) => setRoomKey(e.target.value)}
        placeholder="Room key..."
        className="w-full max-w-md px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring mb-4"
      />

      <button
        onClick={handleJoin}
        className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700"
      >
        Join Chat
      </button>
    </div>
  );
}
