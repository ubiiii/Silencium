import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateRoom() {
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    const roomId = Math.random().toString(36).substring(2, 10);
    navigate(`/chat?room=${roomId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 text-center bg-gray-100">
      <h1
        className="text-3xl font-bold text-gray-800 mb-2"
        style={{ fontFamily: "'Orbitron' " }}
      >
        🔐 Silencium
      </h1>
      <p className="text-gray-600 mb-6" style={{ fontFamily: "'Orbitron' " }}>Start a private, encrypted chat room</p>

      <button
      style={{ fontFamily: "'Orbitron'" }}
        onClick={handleCreateRoom}
        className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700"
      >
        Create Chat Room
      </button>
    </div>
  );
}
