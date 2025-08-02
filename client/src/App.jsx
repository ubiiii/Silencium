import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import ChatRoom from './pages/ChatRoom';
import './src/styles/hacker-theme.css';
import { initSodium } from './crypto/libs'; // ✅ Import sodium initializer

function App() {
  useEffect(() => {
    initSodium(); // ✅ Preload sodium on app load
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<CreateRoom />} />
        <Route path="/join" element={<JoinRoom />} />
        <Route path="/chat" element={<ChatRoom />} />
      </Routes>
    </Router>
  );
}

export default App;
