import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../utils/socket';
import {
  initSodium,
  generateKeyPair,
  getMyKeyPair
} from '../crypto/libs';
import { CryptoWorker } from '../crypto/workerWrapper';
import Message from '../components/Message';
import { rateLimiter } from '../utils/rateLimiter';
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
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [screenshotProtectionEnabled, setScreenshotProtectionEnabled] = useState(true);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [myPublicKey, setMyPublicKey] = useState(null);
  const [hasSharedKey, setHasSharedKey] = useState(false);
  const [encryptionStatus, setEncryptionStatus] = useState('initializing');
  const [rateLimitWarning, setRateLimitWarning] = useState('');
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

    // Rate limiting check for images
    if (!rateLimiter.canUploadImage()) {
      // Reset file input to allow trying again later
      e.target.value = '';
      return;
    }

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

    // Initialize rate limiter with warning callback
    rateLimiter.setWarningCallback((message) => {
      setRateLimitWarning(message);
      // Clear warning after 3 seconds
      setTimeout(() => setRateLimitWarning(''), 3000);
    });

    return () => {
      cryptoWorkerRef.current?.terminate();
      rateLimiter.reset();
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

    // Rate limiting check
    if (!rateLimiter.canSendMessage()) {
      return;
    }

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

      // Handle server-side rate limiting
      socket.on("rate-limit-exceeded", ({ type, reason, remainingTime, violations }) => {
        let message = `Rate limit exceeded for ${type}. `;
        
        if (reason === 'temporarily_banned') {
          const banMinutes = Math.ceil(remainingTime / 60000);
          message += `You are temporarily banned for ${banMinutes} minute${banMinutes > 1 ? 's' : ''}.`;
        } else {
          const waitSeconds = Math.ceil(remainingTime / 1000);
          message += `Please wait ${waitSeconds} second${waitSeconds > 1 ? 's' : ''}.`;
        }
        
        if (violations >= 3) {
          message += ' Multiple violations detected.';
        }
        
        setRateLimitWarning(message);
        setTimeout(() => setRateLimitWarning(''), 5000);
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
           // Handle both string and object messages
           const messageText = typeof msg === 'string' ? msg : msg.text;
           const alreadyExists = prev.some(
             (m) => m.text === messageText && m.sender === "system"
           );
           if (alreadyExists) return prev;
           return [
             ...prev,
             {
               id: crypto.randomUUID(),
               text: messageText,
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

       socket.on("creator-update", (creatorId) => {
         setIsCreator(socket.id === creatorId);
       });

               socket.on("screenshot-protection-update", ({ enabled }) => {
          console.log('🔄 Received protection update from server:', enabled);
          setScreenshotProtectionEnabled(enabled);
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
       socket.off("creator-update");
       socket.off("screenshot-protection-update");
       socket.off("roomDestructed");
       socket.off("start-inactivity-countdown");
       socket.off("cancel-inactivity-countdown");
       socket.off("rate-limit-exceeded");

      if (socket.connected) socket.disconnect();
      joinedRef.current = false;
    };
  }, [roomId, navigate, myPublicKey]);

  const handleLeaveRoom = () => {
    setMessages([]);
    socket.disconnect();
    navigate('/');
  };

  // Screenshot detection handler
  const handleScreenshotDetected = (method, senderId) => {
    // Only send notification if protection is enabled
    if (!screenshotProtectionEnabled) return;
    
    // Send screenshot notification to server
    socket.emit('screenshot-detected', {
      roomId,
      method,
      detectedBy: socket.id,
      targetUser: senderId || 'unknown'
    });
    // Note: Server will broadcast the system message to all users
  };

  // Toggle screenshot protection (creator only)
  const toggleScreenshotProtection = () => {
    if (!isCreator) return;
    
    const newState = !screenshotProtectionEnabled;
    socket.emit('toggle-screenshot-protection', {
      roomId,
      enabled: newState
    });
  };

  // Global screenshot protection for the entire chat
  useEffect(() => {
    if (!roomId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (screenshotProtectionEnabled) {
          setIsChatVisible(false);
          // Notify server about potential screenshot
          socket.emit('screenshot-detected', {
            roomId,
            method: 'visibility_change',
            detectedBy: socket.id,
            targetUser: 'chat_interface'
          });
        }
      } else {
        // Small delay to prevent flickering
        setTimeout(() => setIsChatVisible(true), 100);
      }
    };

    const handleBlur = () => {
      if (screenshotProtectionEnabled) {
        setIsChatVisible(false);
        socket.emit('screenshot-detected', {
          roomId,
          method: 'window_blur',
          detectedBy: socket.id,
          targetUser: 'chat_interface'
        });
      }
    };

    const handleFocus = () => {
      setTimeout(() => setIsChatVisible(true), 100);
    };

    const handleKeyDown = (e) => {
      // Detect common screenshot shortcuts
      const isScreenshotShortcut = (
        (e.ctrlKey && e.shiftKey && e.key === '3') || // macOS Cmd+Shift+3
        (e.ctrlKey && e.shiftKey && e.key === '4') || // macOS Cmd+Shift+4
        (e.ctrlKey && e.key === 'PrintScreen') || // Windows Ctrl+PrintScreen
        (e.key === 'PrintScreen') || // PrintScreen key
        (e.ctrlKey && e.key === 's' && e.altKey) // Windows Alt+Ctrl+S
      );

      if (isScreenshotShortcut && screenshotProtectionEnabled) {
        e.preventDefault();
        socket.emit('screenshot-detected', {
          roomId,
          method: 'keyboard_shortcut',
          detectedBy: socket.id,
          targetUser: 'chat_interface'
        });
      }
    };

    const handleContextMenu = (e) => {
      if (screenshotProtectionEnabled) {
        e.preventDefault();
        socket.emit('screenshot-detected', {
          roomId,
          method: 'context_menu',
          detectedBy: socket.id,
          targetUser: 'chat_interface'
        });
      }
    };

    // Add global event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    // Add CSS protection
    const style = document.createElement('style');
    style.textContent = `
      .chat-outer {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      
      .chat-outer * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      
      .chat-outer input,
      .chat-outer textarea {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
    `;
    document.head.appendChild(style);

             return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.head.removeChild(style);
    };
       }, [roomId, socket, screenshotProtectionEnabled]);

  return (
    <div 
      className="chat-outer"
      style={{
        backgroundColor: !isChatVisible ? '#000' : 'transparent',
        transition: 'background-color 0.2s ease'
      }}
    >
      <div 
        className="chat-container"
        style={{
          opacity: !isChatVisible ? 0 : 1,
          transition: 'opacity 0.2s ease'
        }}
      >
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
          {/* Debug info */}
          <span style={{ 
            fontFamily: "'Orbitron'", 
            fontSize: '12px', 
            color: '#666', 
            marginLeft: '10px' 
          }}>
            Creator: {isCreator ? 'Yes' : 'No'} | Protection: {screenshotProtectionEnabled ? 'ON' : 'OFF'}
          </span>
          {/* Only show button to room creator */}
          {isCreator && (
            <button
              style={{ 
                fontFamily: "'Orbitron' ",
                marginLeft: '10px',
                backgroundColor: screenshotProtectionEnabled ? '#4CAF50' : '#f44336',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onClick={toggleScreenshotProtection}
              title={screenshotProtectionEnabled ? 'Disable Screenshot Protection' : 'Enable Screenshot Protection'}
            >
              {screenshotProtectionEnabled ? '🔒 Protection ON' : '🔓 Protection OFF'}
            </button>
          )}
        </div>

        <div className="chat-messages">
                     {messages.map((msg) => (
             <Message 
               key={msg.id} 
               msg={msg} 
               mySocketId={mySocketId}
               onScreenshotDetected={handleScreenshotDetected}
               protectionEnabled={screenshotProtectionEnabled}
             />
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

        {rateLimitWarning && (
          <div className="rate-limit-warning" style={{ 
            color: '#ff6b6b', 
            backgroundColor: '#2a0a0a', 
            padding: '8px 12px', 
            margin: '5px 0', 
            borderRadius: '4px', 
            border: '1px solid #ff6b6b',
            fontFamily: "'Orbitron', monospace",
            fontSize: '0.9em',
            textAlign: 'center'
          }}>
            ⚠️ {rateLimitWarning}
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