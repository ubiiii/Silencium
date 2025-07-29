import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../utils/socket';
import {
  initSodium,
  generateKeyPair,
  getMyKeyPair
} from '../crypto/libs';
import { CryptoWorker } from '../crypto/workerWrapper';
import '../src/styles/hacker-theme.css';
import '../utils/animations';
import useAutoScroll from '../src/hooks/useAutoScroll';

export default function ChatRoom() {
  const cryptoWorkerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const roomId = params.get('room');
  const [encryptionStatus, setEncryptionStatus] = useState('initializing');
  const messagesEndRef = useRef(null);

  const joinedRef = useRef(false);
  const myPublicKeySent = useRef(false);
  const receivedKey = useRef(null);
  const sharedKeyRef = useRef(null);
  const hasSharedKeyRef = useRef(false);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [myPublicKey, setMyPublicKey] = useState(null);
  const [hasSharedKey, setHasSharedKey] = useState(false);

  useAutoScroll(messagesEndRef, messages);

  useEffect(() => {
    cryptoWorkerRef.current = new CryptoWorker();
    initSodium().then(async () => {
      const keyPair = await generateKeyPair();
      setMyPublicKey(keyPair.publicKey);
    });
    return () => {
      cryptoWorkerRef.current?.terminate();
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!hasSharedKeyRef.current || !cryptoWorkerRef.current) return;

    const { ciphertext, nonce } = await cryptoWorkerRef.current.encrypt(
      new TextEncoder().encode(input),
      sharedKeyRef.current
    );
    socket.emit('send-message', {
      roomId,
      encrypted: Array.from(ciphertext),
      nonce: Array.from(nonce)
    });
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { id: crypto.randomUUID(), text: input, sender: 'me', timestamp: time }]);
    setInput('');
  };

  const handleKeyExchange = async (theirPublicKey, isClient) => {
    const myKeyPair = await getMyKeyPair();
    const sharedKey = await cryptoWorkerRef.current.deriveSharedKey(
      myKeyPair.publicKey,
      myKeyPair.privateKey,
      theirPublicKey,
      isClient
    );
    sharedKeyRef.current = sharedKey;
    hasSharedKeyRef.current = true;
    setHasSharedKey(true);
  };

  useEffect(() => {
    if (!roomId || joinedRef.current) return;
    joinedRef.current = true;

    const setup = async () => {
      if (!socket.connected) socket.connect();

      socket.on('connect', () => {
        socket.emit('join-room', { roomId });
        setEncryptionStatus('socket-connected');

        if (myPublicKey) {
          socket.emit('send-public-key', {
            roomId,
            publicKey: Array.from(myPublicKey)
          });
          myPublicKeySent.current = true;
        }

        setTimeout(() => {
          if (!hasSharedKeyRef.current && myPublicKey) {
            socket.emit('send-public-key', {
              roomId,
              publicKey: Array.from(myPublicKey)
            });
          }
        }, 1500);
      });

      socket.on('receive-public-key', async ({ publicKey, theirSocketId }) => {
        if (receivedKey.current === theirSocketId) return;
        receivedKey.current = theirSocketId;

        const isClient = socket.id === [socket.id, theirSocketId].sort()[1];

        try {
          const decodedKey = new Uint8Array(publicKey);
          await handleKeyExchange(decodedKey, isClient);
          setEncryptionStatus('ready');
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            text: '🔒 End-to-end encryption is now active',
            sender: 'system',
            timestamp: new Date().toLocaleTimeString()
          }]);
        } catch (err) {
          console.error('❌ Key derivation failed:', err);
        }

        if (myPublicKey) {
          socket.emit('send-public-key', {
            roomId,
            publicKey: Array.from(myPublicKey)
          });
        }
      });

      socket.on('receive-message', async ({ encrypted, nonce }) => {
        if (!hasSharedKeyRef.current || !sharedKeyRef.current || !cryptoWorkerRef.current) return;
        const plain = await cryptoWorkerRef.current.decrypt(
          new Uint8Array(encrypted),
          new Uint8Array(nonce),
          sharedKeyRef.current
        );
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages(prev => [...prev, { id: crypto.randomUUID(), text: plain, sender: 'them', timestamp: time }]);
      });

      socket.on('system-message', (msg) => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages(prev => {
          const alreadyExists = prev.some(m => m.text === msg && m.sender === 'system');
          if (alreadyExists) return prev;
          return [...prev, { id: crypto.randomUUID(), text: msg, sender: 'system', timestamp: time }];
        });
      });

      socket.on('join-error', (msg) => {
        alert(`❌ ${msg}`);
        navigate('/');
      });

      socket.on('user-left', () => {
        setMessages([]);
        alert('👋 The other user has left the room.');
        navigate('/');
      });
    };

    setup();

    return () => {
      socket.off('connect');
      socket.off('receive-message');
      socket.off('receive-public-key');
      socket.off('system-message');
      socket.off('join-error');
      socket.off('user-left');
      if (socket.connected) socket.disconnect();
      joinedRef.current = false;
    };
  }, [roomId, navigate, myPublicKey]);

  const handleLeaveRoom = () => {
    setMessages([]);
    socket.disconnect();
    navigate('/');
  };

  return (
    <div className="chat-outer">
      <div className="chat-container">
        <div className="chat-header">
          <h1>🔐 Silencium</h1>
          <button onClick={handleLeaveRoom}>Leave Chat</button>
        </div>

        <div className="chat-link">
          <p>Share this link to invite someone:</p>
          <div className="chat-link-box">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/chat?room=${roomId}`}
            />
            <button
              onClick={() =>
                navigator.clipboard.writeText(`${window.location.origin}/chat?room=${roomId}`)
              }
            >
              Copy
            </button>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-row ${
                msg.sender === 'me'
                  ? 'align-right'
                  : msg.sender === 'them'
                  ? 'align-left'
                  : 'align-center'
              }`}
            >
              <div className={`message-bubble ${msg.sender === 'system' ? 'system-msg' : 'user-msg'}`}>
                <div>{msg.text}</div>
                {msg.timestamp && <div className="timestamp">{msg.timestamp}</div>}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="> Type a message..."
            disabled={!hasSharedKeyRef.current}
          />
          <button onClick={sendMessage} disabled={!hasSharedKeyRef.current}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
