import { io } from 'socket.io-client';

const URL = import.meta.env.MODE === 'production' 
  ? window.location.origin 
  : 'http://localhost:3001';

// In socket.js
export const socket = io(URL, {
  autoConnect: false,
  transports: ['websocket'], // Force WebSocket only
  forceBase64: false,        // Allow binary data
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Connection status logging (only in development)
if (import.meta.env.DEV) {
  socket.on('connect', () => {
    console.log('🟢 Connected to server with ID:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Disconnected from server');
  });

  socket.on('connect_error', (err) => {
    console.error('Connection error:', err.message);
  });
}