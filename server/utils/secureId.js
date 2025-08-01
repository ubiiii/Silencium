const crypto = require('crypto');

/**
 * Generate a cryptographically secure room ID
 * Format: 32 characters, mix of uppercase, lowercase, and numbers
 * Example: "A7k9M2nQ8xR5vB3wC6yE1zF4pL0sT9uG"
 */
function generateSecureRoomId() {
  // Use crypto.randomBytes for cryptographic security
  const bytes = crypto.randomBytes(24); // 24 bytes = 32 base64 chars (after padding removal)
  
  // Convert to base64 and clean up
  let roomId = bytes.toString('base64')
    .replace(/[+/=]/g, '') // Remove base64 special chars
    .substring(0, 32); // Ensure exactly 32 chars
  
  // Mix case and add numbers for complexity
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let secureId = '';
  
  for (let i = 0; i < 32; i++) {
    if (i < roomId.length) {
      // Use existing char as seed for randomness
      const seed = roomId.charCodeAt(i);
      secureId += chars[seed % chars.length];
    } else {
      // Fill remaining with random chars
      secureId += chars[crypto.randomInt(0, chars.length)];
    }
  }
  
  return secureId;
}

/**
 * Validate room ID format
 * Must be exactly 32 characters, alphanumeric only
 */
function isValidRoomId(roomId) {
  if (!roomId || typeof roomId !== 'string') {
    return false;
  }
  
  // Must be exactly 32 characters
  if (roomId.length !== 32) {
    return false;
  }
  
  // Must contain only alphanumeric characters
  const validPattern = /^[A-Za-z0-9]{32}$/;
  return validPattern.test(roomId);
}

/**
 * Generate a human-readable room ID (for display purposes)
 * Breaks the 32-char ID into 4 groups of 8 characters
 * Example: "A7k9M2nQ-8xR5vB3w-C6yE1zF4-pL0sT9uG"
 */
function formatRoomIdForDisplay(roomId) {
  if (!isValidRoomId(roomId)) {
    return roomId;
  }
  
  return roomId.match(/.{1,8}/g).join('-');
}

module.exports = {
  generateSecureRoomId,
  isValidRoomId,
  formatRoomIdForDisplay
};