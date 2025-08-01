class ServerRateLimiter {
  constructor() {
    this.clients = new Map(); // socketId -> { lastMessage, lastImage, violations }
    this.messageLimit = 1000; // 1 message per second
    this.imageLimit = 5000;   // 1 image per 5 seconds
    this.maxViolations = 5;   // Max violations before temporary ban
    this.banDuration = 60000; // 1 minute ban
  }

  checkMessageRate(socketId) {
    const now = Date.now();
    const client = this.clients.get(socketId) || { 
      lastMessage: 0, 
      lastImage: 0, 
      violations: 0,
      bannedUntil: 0
    };

    // Check if client is currently banned
    if (client.bannedUntil > now) {
      return { allowed: false, reason: 'temporarily_banned', remainingTime: client.bannedUntil - now };
    }

    const timeSinceLastMessage = now - client.lastMessage;
    
    if (timeSinceLastMessage < this.messageLimit) {
      client.violations++;
      
      if (client.violations >= this.maxViolations) {
        client.bannedUntil = now + this.banDuration;
        console.log(`⚠️ Client ${socketId} temporarily banned for rate limit violations`);
      }
      
      this.clients.set(socketId, client);
      return { 
        allowed: false, 
        reason: 'rate_limit', 
        remainingTime: this.messageLimit - timeSinceLastMessage,
        violations: client.violations
      };
    }

    client.lastMessage = now;
    client.violations = Math.max(0, client.violations - 1); // Reduce violations over time
    this.clients.set(socketId, client);
    return { allowed: true };
  }

  checkImageRate(socketId) {
    const now = Date.now();
    const client = this.clients.get(socketId) || { 
      lastMessage: 0, 
      lastImage: 0, 
      violations: 0,
      bannedUntil: 0
    };

    // Check if client is currently banned
    if (client.bannedUntil > now) {
      return { allowed: false, reason: 'temporarily_banned', remainingTime: client.bannedUntil - now };
    }

    const timeSinceLastImage = now - client.lastImage;
    
    if (timeSinceLastImage < this.imageLimit) {
      client.violations++;
      
      if (client.violations >= this.maxViolations) {
        client.bannedUntil = now + this.banDuration;
        console.log(`⚠️ Client ${socketId} temporarily banned for rate limit violations`);
      }
      
      this.clients.set(socketId, client);
      return { 
        allowed: false, 
        reason: 'rate_limit', 
        remainingTime: this.imageLimit - timeSinceLastImage,
        violations: client.violations
      };
    }

    client.lastImage = now;
    client.violations = Math.max(0, client.violations - 1); // Reduce violations over time
    this.clients.set(socketId, client);
    return { allowed: true };
  }

  removeClient(socketId) {
    this.clients.delete(socketId);
  }

  // Clean up old entries periodically
  cleanup() {
    const now = Date.now();
    const oldEntries = [];
    
    for (const [socketId, client] of this.clients.entries()) {
      // Remove entries older than 10 minutes with no violations
      if (now - Math.max(client.lastMessage, client.lastImage) > 600000 && client.violations === 0) {
        oldEntries.push(socketId);
      }
    }
    
    oldEntries.forEach(socketId => this.clients.delete(socketId));
    
    if (oldEntries.length > 0) {
      console.log(`🧹 Cleaned up ${oldEntries.length} old rate limiter entries`);
    }
  }
}

const rateLimiter = new ServerRateLimiter();

// Clean up old entries every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

module.exports = rateLimiter;