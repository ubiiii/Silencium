import React, { useEffect, useState } from 'react';
import { socket } from '../utils/socket';
import { useLocation } from 'react-router-dom';
import { isValidRoomId, cleanRoomId, formatRoomIdForDisplay } from '../utils/roomValidation';

export default function JoinRoom() {
  const [roomKey, setRoomKey] = useState('');
  const [error, setError] = useState('');
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
      setError(`Could not join room: ${errorMsg}`);
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    });

    return () => {
      socket.off('receive-message');
      socket.off('join-error');
    };
  }, [roomId]);

  const handleJoin = () => {
    const cleanedRoomId = cleanRoomId(roomKey);
    
    if (!cleanedRoomId) {
      setError('Please enter a room ID');
      return;
    }
    
    if (!isValidRoomId(cleanedRoomId)) {
      setError('Invalid room ID format. Room IDs must be 32 alphanumeric characters.');
      return;
    }
    
    setError('');
    window.location.href = `/chat?room=${cleanedRoomId}`;
  };

  const handleRoomKeyChange = (e) => {
    const value = e.target.value;
    setRoomKey(value);
    setError(''); // Clear error when user types
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 text-center bg-gray-100">
      <h1 className="text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: "'Orbitron'" }}>🔐 Join Silencium Room</h1>
      <p className="text-gray-600 mb-4" style={{ fontFamily: "'Orbitron'" }}>Enter the 32-character room ID</p>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded max-w-md" style={{ fontFamily: "'Orbitron'" }}>
          ⚠️ {error}
        </div>
      )}

      <input
        type="text"
        value={roomKey}
        onChange={handleRoomKeyChange}
        placeholder="Paste room ID here (32 characters)..."
        className="w-full max-w-md px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring mb-4"
        style={{ fontFamily: "'Courier New', monospace" }}
        maxLength={40} // Allow some extra for formatted input
      />

      {roomKey && (
        <p className="text-sm text-gray-500 mb-4" style={{ fontFamily: "'Courier New', monospace" }}>
          Length: {cleanRoomId(roomKey).length}/32 characters
        </p>
      )}

      <button
        onClick={handleJoin}
        className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700"
        style={{ fontFamily: "'Orbitron'" }}
      >
        Join Chat
      </button>
    </div>
  );
}
