import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../utils/socket';
import {
  initSodium,
  generateKeyPair,
  getMyKeyPair
} from '../crypto/libs';
import { CryptoWorker } from '../crypto/workerWrapper';
import CanvasImageRenderer from '../components/CanvasImageRenderer';
import '../src/styles/hacker-theme.css';
import '../utils/animations';
import useAutoScroll from '../src/hooks/useAutoScroll';

export default function ChatRoom() {
  const [timeLeft, setTimeLeft] = useState(null);
  const timerStartRef = useRef(null);
  const cryptoWorkerRef = useRef(null);
  const joinedRef = useRef(false);
  const myPublicKeySent = useRef(false);
  const receivedKey = useRef(null);
  const sharedKeyRef = useRef(null);
  const hasSharedKeyRef = useRef(false);
  const [mySocketId, setMySocketId] = useState('');

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [myPublicKey, setMyPublicKey] = useState(null);
  const [hasSharedKey, setHasSharedKey] = useState(false);
  const [encryptionStatus, setEncryptionStatus] = useState('initializing');
  const messagesEndRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const roomId = params.get('room');
  const fileInputRef = useRef(null);

      useEffect(() => {
        const handleReceiveImage = (data) => {
          setMessages((prev) => {
            const exists = prev.some(
              (msg) => msg.image === data.image && msg.sender === data.sender
            );
            if (exists) return prev;
            return [...prev, { id: crypto.randomUUID(), ...data }];
          });
        };

        socket.on('receive-image', handleReceiveImage);

        return () => {
          socket.off('receive-image', handleReceiveImage); // ✅ CLEANUP!
        };
      }, []);


  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
      alert('Only JPG/PNG/GIF under 5MB allowed');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result;
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          image: imageData,
          name: file.name,
          type: file.type,
          sender: socket.id,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
            })
        }
      ]);
      socket.emit('image-message', {
        roomId,
        image: imageData,
        name: file.name,
        type: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

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

  useEffect(() => {
    const handleConnect = () => {
      setMySocketId(socket.id);
      socket.emit("join-room", { roomId });
      setEncryptionStatus("socket-connected");

      if (myPublicKey) {
        socket.emit("send-public-key", {
          roomId,
          publicKey: Array.from(myPublicKey),
        });
        myPublicKeySent.current = true;
      }

      setTimeout(() => {
        if (!hasSharedKeyRef.current && myPublicKey) {
          socket.emit("send-public-key", {
            roomId,
            publicKey: Array.from(myPublicKey),
          });
        }
      }, 1500);
    };

    socket.on("connect", handleConnect);
    return () => socket.off("connect", handleConnect);
  }, [myPublicKey, roomId]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!hasSharedKeyRef.current || !cryptoWorkerRef.current) return;

    const { ciphertext, nonce } = await cryptoWorkerRef.current.encrypt(
      new TextEncoder().encode(input),
      sharedKeyRef.current
    );
    socket.emit("send-message", {
      roomId,
      encrypted: Array.from(ciphertext),
      nonce: Array.from(nonce)
    });
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { id: crypto.randomUUID(), text: input, sender: socket.id, timestamp: time }]);
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

    const IDLE_AFTER = 15 * 1000;
    const INACTIVITY_LIMIT = 10 * 60 * 1000;

    let idle = false;
    let idleTimer;
    let countdownInterval;

    const handleActivity = () => {
      clearTimeout(idleTimer);
      if (idle) {
        idle = false;
        socket.emit("cancelInactivityCountdown");
      }

      idleTimer = setTimeout(() => {
        idle = true;
        socket.emit("startInactivityCountdown");
      }, IDLE_AFTER);
    };

    ["mousemove", "keydown", "click", "touchstart"].forEach(event =>
      window.addEventListener(event, handleActivity)
    );
    handleActivity();

    const setup = async () => {
      if (!socket.connected) socket.connect();

      socket.on("roomDestructed", (msg) => {
        clearInterval(countdownInterval);
        setTimeLeft(0);
        alert(msg);
        socket.disconnect();
        navigate("/");
      });

      socket.on("start-inactivity-countdown", ({ startTime }) => {
        clearInterval(countdownInterval);
        timerStartRef.current = startTime;

        countdownInterval = setInterval(() => {
          const elapsed = Date.now() - timerStartRef.current;
          const remaining = Math.max(0, INACTIVITY_LIMIT - elapsed);
          setTimeLeft(Math.ceil(remaining / 1000));
        }, 1000);
      });

      socket.on("cancel-inactivity-countdown", () => {
        clearInterval(countdownInterval);
        setTimeLeft(null);
      });

      socket.on("receive-public-key", async ({ publicKey, theirSocketId }) => {
        if (receivedKey.current === theirSocketId) return;
        receivedKey.current = theirSocketId;

        const isClient = socket.id === [socket.id, theirSocketId].sort()[1];

        try {
          const decodedKey = new Uint8Array(publicKey);
          await handleKeyExchange(decodedKey, isClient);
          setEncryptionStatus("ready");
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              text: "🔒 End-to-end encryption is now active",
              sender: "system",
              timestamp: new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })
            },
          ]);
        } catch (err) {
          console.error("❌ Key derivation failed:", err);
        }

        if (myPublicKey) {
          socket.emit("send-public-key", {
            roomId,
            publicKey: Array.from(myPublicKey),
          });
        }
      });

      socket.on("receive-message", async ({ encrypted, nonce }) => {
        if (!hasSharedKeyRef.current || !sharedKeyRef.current || !cryptoWorkerRef.current) return;
        const plain = await cryptoWorkerRef.current.decrypt(
          new Uint8Array(encrypted),
          new Uint8Array(nonce),
          sharedKeyRef.current
        );
        const time = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            text: plain,
            sender: "them",
            timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })

          },
        ]);
      });

      socket.on("system-message", (msg) => {
        const time = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        setMessages((prev) => {
          const alreadyExists = prev.some(
            (m) => m.text === msg && m.sender === "system"
          );
          if (alreadyExists) return prev;
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              text: msg,
              sender: "system",
              timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })

            },
          ];
        });
      });

      socket.on("join-error", (msg) => {
        alert(`❌ ${msg}`);
        navigate("/");
      });

      socket.on("user-left", () => {
        setMessages([]);
        alert("👋 The other user has left the room.");
        navigate("/");
      });
    };

    setup();

    return () => {
      clearTimeout(idleTimer);
      clearInterval(countdownInterval);
      ["mousemove", "keydown", "click", "touchstart"].forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );

      socket.off("receive-message");
      socket.off("receive-public-key");
      socket.off("system-message");
      socket.off("join-error");
      socket.off("user-left");
      socket.off("roomDestructed");
      socket.off("start-inactivity-countdown");
      socket.off("cancel-inactivity-countdown");

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
          <h1 style={{ fontFamily: "'Orbitron' " }}>🔐 Silencium</h1>
          <button onClick={handleLeaveRoom} style={{ fontFamily: "'Orbitron' " }}>Leave Chat</button>
        </div>

        <div className="chat-link">
          <span style={{ fontFamily: "'Orbitron'" }}>Share Link For Invitation:</span> &nbsp;
          <button
            style={{ fontFamily: "'Orbitron' " }}
            onClick={() =>
              navigator.clipboard.writeText(`${window.location.origin}/chat?room=${roomId}`)
            }
          >
            Copy Link
          </button>
        </div>

        <div className="chat-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-row ${
                msg.sender === mySocketId
                  ? 'align-right'
                  : msg.sender && msg.sender !== 'system'
                  ? 'align-left'
                  : 'align-center'
              }`}
            >
              <div className={`message-bubble ${msg.sender === 'system' ? 'system-msg' : 'user-msg'}`}>
                {msg.type?.startsWith('image') ? (
                        <CanvasImageRenderer imageData={msg.image} />
                      ) : (
                        <div>{msg.text ?? '[no text]'}</div>
                      )}

                      {msg.timestamp && (msg.text || msg.image) && (
                        <div className="timestamp">{msg.timestamp}</div>
                      )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {timeLeft !== null && timeLeft > 0 && (
          <div className="inactivity-warning" style={{ fontFamily: "'Orbitron' " }}>
            ⚠️ Session expires in {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')} due to inactivity
          </div>
        )}

        {timeLeft === 0 && (
          <div className="expired-warning">
            🔒 Session expired due to inactivity
          </div>
        )}

        <div className="chat-input">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            ref={fileInputRef}
          />

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="> Type a message..."
            disabled={!hasSharedKey}
          />
          <button onClick={() => fileInputRef.current.click()}>
            📎
          </button>
          <button onClick={sendMessage} disabled={!hasSharedKey}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}