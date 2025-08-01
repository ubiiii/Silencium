export class RateLimiter {
  constructor() {
    this.messageLimit = 1000; // 1 message per second
    this.imageLimit = 5000;   // 1 image per 5 seconds
    this.lastMessageTime = 0;
    this.lastImageTime = 0;
    this.warningCallback = null;
  }

  setWarningCallback(callback) {
    this.warningCallback = callback;
  }

  canSendMessage() {
    const now = Date.now();
    const timeSinceLastMessage = now - this.lastMessageTime;
    
    if (timeSinceLastMessage < this.messageLimit) {
      const remainingTime = Math.ceil((this.messageLimit - timeSinceLastMessage) / 1000);
      if (this.warningCallback) {
        this.warningCallback(`You're sending messages too fast. Please wait ${remainingTime} second${remainingTime > 1 ? 's' : ''}.`);
      }
      return false;
    }
    
    this.lastMessageTime = now;
    return true;
  }

  canUploadImage() {
    const now = Date.now();
    const timeSinceLastImage = now - this.lastImageTime;
    
    if (timeSinceLastImage < this.imageLimit) {
      const remainingTime = Math.ceil((this.imageLimit - timeSinceLastImage) / 1000);
      if (this.warningCallback) {
        this.warningCallback(`You're uploading images too fast. Please wait ${remainingTime} second${remainingTime > 1 ? 's' : ''}.`);
      }
      return false;
    }
    
    this.lastImageTime = now;
    return true;
  }

  reset() {
    this.lastMessageTime = 0;
    this.lastImageTime = 0;
  }
}

// Singleton instance for the app
export const rateLimiter = new RateLimiter();