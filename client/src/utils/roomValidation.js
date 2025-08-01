/**
 * Client-side room ID validation
 * Must match server-side validation in server/utils/secureId.js
 */

/**
 * Validate room ID format
 * Must be exactly 32 characters, alphanumeric only
 */
export function isValidRoomId(roomId) {
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
 * Format room ID for display
 * Breaks the 32-char ID into 4 groups of 8 characters
 * Example: "A7k9M2nQ-8xR5vB3w-C6yE1zF4-pL0sT9uG"
 */
export function formatRoomIdForDisplay(roomId) {
  if (!isValidRoomId(roomId)) {
    return roomId;
  }
  
  return roomId.match(/.{1,8}/g).join('-');
}

/**
 * Clean room ID input (remove dashes, spaces, etc.)
 */
export function cleanRoomId(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove all non-alphanumeric characters
  return input.replace(/[^A-Za-z0-9]/g, '');
}