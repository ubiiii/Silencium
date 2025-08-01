const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting middleware
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message,
  standardHeaders: true,
  legacyHeaders: false,
});

// API rate limiting - stricter than socket rate limiting
const apiLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later.'
);

// Room creation rate limiting - prevent room spam
const roomCreationLimiter = createRateLimit(
  60 * 1000, // 1 minute
  5, // limit each IP to 5 room creations per minute
  'Too many rooms created from this IP, please try again later.'
);

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Needed for React
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws://localhost:*", "wss://localhost:*"], // WebSocket connections
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for WebSocket compatibility
});

// Production-only middleware
const productionSecurity = (req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Prevent caching of sensitive data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  next();
};

// Request validation middleware
const validateRequest = (req, res, next) => {
  // Block requests with suspicious patterns
  const suspiciousPatterns = [
    /\.\./g, // Path traversal
    /<script/gi, // XSS attempts
    /union.*select/gi, // SQL injection
    /javascript:/gi, // JavaScript injection
    /data:text\/html/gi, // Data URI XSS
  ];
  
  const requestData = JSON.stringify({
    url: req.url,
    query: req.query,
    body: req.body,
    headers: req.headers
  });
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestData)) {
      console.warn(`🚨 Suspicious request blocked from ${req.ip}: ${pattern}`);
      return res.status(400).json({ error: 'Invalid request' });
    }
  }
  
  next();
};

// Error handling middleware (don't expose stack traces in production)
const errorHandler = (err, req, res, next) => {
  console.error('Server error:', err);
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Something went wrong'
    });
  } else {
    res.status(500).json({ 
      error: err.message,
      stack: err.stack
    });
  }
};

module.exports = {
  apiLimiter,
  roomCreationLimiter,
  securityHeaders,
  productionSecurity,
  validateRequest,
  errorHandler
};