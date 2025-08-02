export const MESSAGE_TYPES = {
  USER: 'user',
  SYSTEM: 'system'
};

export const SOCKET_EVENTS = {
  JOIN_ROOM: 'join-room',
  SEND_MESSAGE: 'send-message',
  RECEIVE_MESSAGE: 'receive-message',
  PUBLIC_KEY_EXCHANGE: 'send-public-key',
  USER_LEFT: 'user-left',
  SYSTEM_MESSAGE: 'system-message'
};

export const CRYPTO = {
  NONCE_BYTES: 24, // For crypto_secretbox
  KEY_BYTES: 32    // X25519 key size
};
