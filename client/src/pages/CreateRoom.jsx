import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateRoom() {
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    const roomId = Math.random().toString(36).substring(2, 10);
    navigate(`/chat?room=${roomId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 text-center bg-black">
      {/* Logo with orange padlock */}
      <div className="mb-8">
        <h1
          className="text-4xl font-bold text-green-500 mb-2"
          style={{ fontFamily: "'Orbitron'" }}
        >
          🔒 Silencium
        </h1>
      </div>

      {/* Main headline */}
      <h2 
        className="text-2xl font-semibold text-green-500 mb-8"
        style={{ fontFamily: "'Orbitron'" }}
      >
        Start a Private & <br /> Encrypted Conversation
      </h2>

      {/* Create Chat Room Button */}
      <button
        onClick={handleCreateRoom}
        className="px-8 py-4 border-2 border-green-500 text-green-500 rounded-lg font-semibold hover:bg-green-500 hover:text-black transition-colors duration-300 mb-12"
        style={{ fontFamily: "'Orbitron'" }}
      >
        Create Chat Room
      </button>
      <br />

      {/* Features List */}
      <div className="text-green-500 text-left max-w-md">
        <div className="mb-2" style={{ fontFamily: "'Orbitron'" }}>
          <span className="text-green-500">→</span>  No Accounts, Ever
        </div>
        <br />
        <div className="mb-2" style={{ fontFamily: "'Orbitron'" }}>
          <span className="text-green-500">→</span>  No Logs/Data Storage
        </div>
        <br />
        <div className="mb-2" style={{ fontFamily: "'Orbitron'" }}>
          <span className="text-green-500">→</span>  Self-Destructing Chats
        </div>
        <br />
        <div className="mb-2" style={{ fontFamily: "'Orbitron'" }}>
          <span className="text-green-500">→</span>  End-to-End Encryption
        </div>
        <br />
        <div className="mb-2" style={{ fontFamily: "'Orbitron'" }}>
          <span className="text-green-500">→</span> Secure Image Sharing
        </div>
      </div>
    </div>
  );
}
