import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateRoom() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    setIsCreating(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:3001/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        navigate(`/chat?room=${data.roomId}`);
      } else {
        setError(data.error || 'Failed to create room');
      }
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Network error. Please check if the server is running.');
    } finally {
      setIsCreating(false);
    }
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

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded" style={{ fontFamily: "'Orbitron'" }}>
          {error}
        </div>
      )}

      <button
        style={{ fontFamily: "'Orbitron'" }}
        onClick={handleCreateRoom}
        disabled={isCreating}
        className={`px-6 py-3 rounded-full font-semibold ${
          isCreating 
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isCreating ? 'Creating Secure Room...' : 'Create Chat Room'}
      </button>
    </div>
  );
}
