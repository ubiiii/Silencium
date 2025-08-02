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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [encryptionStatus, setEncryptionStatus] = useState('initializing'); // Used for debugging
  const messagesEndRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const roomId = params.get('room');
  const fileInputRef = useRef(null);
  const imageHandlersRegistered = useRef(false);

      useEffect(() => {
        // Prevent multiple registrations
        if (imageHandlersRegistered.current) return;
        imageHandlersRegistered.current = true;

        const handleReceiveImage = (data) => {
          setMessages((prev) => {
            const exists = prev.some(
              (msg) => msg.image === data.image && msg.sender === data.sender
            );
            if (exists) return prev;
            return [...prev, { id: crypto.randomUUID(), ...data }];
          });
        };

        const handleReceiveEncryptedImage = async ({ encrypted, nonce, name, type }) => {
          if (!hasSharedKeyRef.current || !sharedKeyRef.current || !cryptoWorkerRef.current) return;
          
          try {
            if (import.meta.env.DEV) {
              console.log('Decrypting image:', { name, type, encryptedLength: encrypted.length });
            }
            
            const decryptedBytes = await cryptoWorkerRef.current.decrypt(
              new Uint8Array(encrypted),
              new Uint8Array(nonce),
              sharedKeyRef.current
            );
            
            if (import.meta.env.DEV) {
              console.log('Decrypted bytes length:', decryptedBytes.length);
              console.log('Decrypted bytes type:', typeof decryptedBytes, decryptedBytes.constructor.name);
              console.log('Decrypted bytes buffer:', decryptedBytes.buffer);
            }
            
            // Handle the decrypted data - it might be a string or binary data
            let imageData;
            if (typeof decryptedBytes === 'string') {
              // If it's already a string, use it directly
              imageData = decryptedBytes;
            } else if (decryptedBytes instanceof Uint8Array) {
              imageData = new TextDecoder().decode(decryptedBytes);
            } else if (decryptedBytes instanceof ArrayBuffer) {
              imageData = new TextDecoder().decode(decryptedBytes);
            } else {
              // Convert to Uint8Array first
              const uint8Array = new Uint8Array(decryptedBytes);
              imageData = new TextDecoder().decode(uint8Array);
            }
            
            if (import.meta.env.DEV) {
              console.log('Reconstructed image data preview:', imageData.substring(0, 100) + '...');
            }
            
            setMessages((prev) => {
              // Check for duplicates based on image data hash or timestamp
              const exists = prev.some(
                (msg) => msg.image === imageData && msg.sender === "them" && msg.name === name
              );
              if (exists) return prev;
              
              return [...prev, {
                id: crypto.randomUUID(),
                image: imageData,
                name,
                type,
                sender: "them",
                timestamp: new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              }];
            });
          } catch (err) {
            console.error('Failed to decrypt image:', err);
          }
        };

        socket.on('receive-image', handleReceiveImage);
        socket.on('receive-encrypted-image', handleReceiveEncryptedImage);

        return () => {
          socket.off('receive-image', handleReceiveImage);
          socket.off('receive-encrypted-image', handleReceiveEncryptedImage);
          imageHandlersRegistered.current = false;
        };
      }, []);


  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if encryption is ready
    if (!hasSharedKeyRef.current || !cryptoWorkerRef.current) {
      alert('Please wait for encryption to be established before sending images.');
      return;
    }

    // Check if socket is connected
    if (!socket.connected) {
      alert('Connection lost. Please refresh the page.');
      return;
    }

    // Check if already uploading
    if (isUploadingImage) {
      alert('Please wait for the current upload to complete.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type) || file.size > 6 * 1024 * 1024) {
      alert('Only JPG/PNG/GIF under 6MB allowed');
      return;
    }

    // More aggressive size limit for stability
    if (file.size > 3 * 1024 * 1024) { // 3MB limit for stability
      alert('Image too large. Please use images under 3MB for better stability.');
      return;
    }

    setIsUploadingImage(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const imageData = reader.result;
      
      if (import.meta.env.DEV) {
      console.log('Original image data preview:', imageData.substring(0, 100) + '...');
    }
      
      try {
        // Always compress images for better stability
        let processedImageData = await compressImage(imageData, file.type);
        if (import.meta.env.DEV) {
          console.log('Image compressed to reduce size');
        }

        // Use a simpler approach - encrypt the base64 string directly
        const imageBytes = new TextEncoder().encode(processedImageData);
        
        if (import.meta.env.DEV) {
          console.log('Image bytes length for encryption:', imageBytes.length);
        }

        // More conservative limit for encrypted data
        if (imageBytes.length > 2 * 1024 * 1024) { // 2MB limit for encrypted data
          alert('Image too large after compression. Please use a smaller image.');
          setIsUploadingImage(false);
          return;
        }

        // Add timeout for encryption
        const encryptionPromise = cryptoWorkerRef.current.encrypt(
          imageBytes,
          sharedKeyRef.current
        );

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Encryption timeout')), 30000)
        );

        const { ciphertext, nonce } = await Promise.race([encryptionPromise, timeoutPromise]);

        if (import.meta.env.DEV) {
          console.log('Encrypted data length:', ciphertext.length);
        }

        // Send encrypted image
        socket.emit('send-encrypted-image', {
          roomId,
          encrypted: Array.from(ciphertext),
          nonce: Array.from(nonce),
          name: file.name,
          type: file.type,
        });

        // Add a longer delay to prevent overwhelming the socket
        await new Promise(resolve => setTimeout(resolve, 500));

        // Add to local messages
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            image: processedImageData,
            name: file.name,
            type: file.type,
            sender: socket.id,
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })
          }
        ]);
      } catch (err) {
        console.error('Failed to encrypt image:', err);
        alert('Failed to encrypt image. Please try again.');
      } finally {
        setIsUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Improved image compression function
  const compressImage = (imageData, type) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // More aggressive size reduction (max 1280x720)
        let { width, height } = img;
        const maxWidth = 1280;
        const maxHeight = 720;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // More aggressive compression
        const quality = type === 'image/jpeg' ? 0.6 : 0.7;
        const compressedData = canvas.toDataURL(type, quality);
        
        if (import.meta.env.DEV) {
          console.log(`Compressed image from ${img.width}x${img.height} to ${width}x${height}`);
        }
        resolve(compressedData);
      };
      img.src = imageData;
    });
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

  // Reset image handlers when room changes
  useEffect(() => {
    return () => {
      imageHandlersRegistered.current = false;
    };
  }, [roomId]);

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

    const handleDisconnect = (reason) => {
      if (import.meta.env.DEV) {
        console.log('Socket disconnected:', reason);
      }
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        if (import.meta.env.DEV) {
          console.log('Attempting to reconnect...');
        }
        socket.connect();
      } else if (reason === 'transport close' || reason === 'ping timeout') {
        // Network issues, try to reconnect
        if (import.meta.env.DEV) {
          console.log('Network issue detected, attempting to reconnect...');
        }
        setTimeout(() => {
          if (!socket.connected) {
            socket.connect();
          }
        }, 1000);
      }
    };

    const handleError = (error) => {
      console.error('Socket error:', error);
    };

    const handleReconnect = (attemptNumber) => {
      if (import.meta.env.DEV) {
        console.log('Socket reconnected on attempt:', attemptNumber);
      }
      // Re-join the room after reconnection
      if (roomId) {
        socket.emit("join-room", { roomId });
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("error", handleError);
    socket.on("reconnect", handleReconnect);
    
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("error", handleError);
      socket.off("reconnect", handleReconnect);
    };
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

      socket.on("room-destroyed", ({ message, leftUserId }) => {
        clearInterval(countdownInterval);
        setTimeLeft(0);
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            text: `⚠️ ${message}`,
            sender: "system",
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })
          }
        ]);
        
        // Show notification and redirect after a short delay
        setTimeout(() => {
          alert(message);
          socket.disconnect();
          navigate("/");
        }, 1000);
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
      socket.off("room-destroyed");
      socket.off("start-inactivity-countdown");
      socket.off("cancel-inactivity-countdown");

      if (socket.connected) socket.disconnect();
      joinedRef.current = false;
    };
  }, [roomId, navigate, myPublicKey]);

  const handleLeaveRoom = () => {
    setMessages([]);
    // Emit a leave event before disconnecting
    socket.emit('leave-room', { roomId });
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

        <div className="encryption-status" style={{ 
          fontFamily: "'Orbitron'", 
          textAlign: 'center', 
          padding: '8px',
          margin: '8px 0',
          borderRadius: '4px',
          backgroundColor: hasSharedKey ? '#1a4d1a' : '#4d1a1a',
          color: '#00ff00',
          fontSize: '12px'
        }}>
          {hasSharedKey ? '🔒 Encryption Active' : '⏳ Establishing Encryption...'}
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
                        <CanvasImageRenderer imageData={msg.image} imageName={msg.name} />
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
          <button 
            onClick={() => fileInputRef.current.click()} 
            disabled={!hasSharedKey || isUploadingImage}
            title={!hasSharedKey ? "Wait for encryption to be established" : isUploadingImage ? "Uploading image..." : "Attach image"}
          >
            {isUploadingImage ? '⏳' : '📎'}
          </button>
          <button onClick={sendMessage} disabled={!hasSharedKey}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}