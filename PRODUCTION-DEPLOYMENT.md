# 🔐 Silencium - Production Deployment Guide

This guide covers the secure deployment of Silencium with all implemented security features.

## 🛡️ Security Features Implemented

### 1. ✅ Client-Side DoS Protection
- **Message Rate Limiting**: 1 message per second per user
- **Image Rate Limiting**: 1 image upload every 5 seconds per user
- **Soft Warnings**: User-friendly rate limit notifications
- **Auto-reset**: Limits reset automatically, no permanent blocks

### 2. ✅ Enhanced Room ID Security
- **32-Character IDs**: Cryptographically secure room identifiers
- **Alphanumeric Only**: No special characters to prevent injection
- **Server Validation**: Both client and server validate room ID format
- **Unguessable**: ~2^190 possible combinations (practically impossible to guess)

### 3. ✅ Production Code Hardening
- **Code Obfuscation**: JavaScript code is heavily obfuscated in production
- **Debug Removal**: All console.log, debugger statements removed
- **Minification**: Code is compressed and optimized
- **Source Map Removal**: No debugging information exposed
- **Build Validation**: Automated checks prevent debug code in production

## 🚀 Deployment Steps

### Prerequisites
```bash
# Ensure you have Node.js 18+ installed
node --version
npm --version
```

### 1. Client Build & Validation
```bash
cd client

# Install dependencies
npm install

# Build with security validation
npm run build:secure

# Or build and validate separately
npm run build
npm run validate
```

The build process will:
- Minify and obfuscate all JavaScript
- Remove all console.log statements
- Disable source maps
- Validate no debug code remains

### 2. Server Production Setup
```bash
cd server

# Install dependencies
npm install

# Set production environment
export NODE_ENV=production

# Start server
npm start
```

### 3. Environment Variables
Set these environment variables in production:

```bash
# Server
export NODE_ENV=production
export PORT=3001

# Optional: Database URL, Redis URL, etc.
# export DATABASE_URL=your_database_url
# export REDIS_URL=your_redis_url
```

### 4. Security Headers Verification
Once deployed, verify security headers are active:

```bash
curl -I http://your-domain.com
```

Expected headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
```

## 🔧 Production Configuration

### Rate Limiting
- **API Requests**: 100 requests per 15 minutes per IP
- **Room Creation**: 5 rooms per minute per IP
- **Messages**: 1 per second per user (client + server enforced)
- **Images**: 1 per 5 seconds per user (client + server enforced)

### Security Middleware
- **Helmet.js**: Security headers and CSP
- **Request Validation**: Blocks suspicious patterns
- **Error Handling**: No stack traces exposed in production
- **CORS**: Configured for your domain only

### File System Protection
```bash
# Make application files read-only (Linux/macOS)
chmod -R 444 dist/
chmod -R 444 server/

# Or use Docker with read-only filesystem
docker run --read-only -v /tmp -v /var/tmp your-silencium-image
```

## 🐳 Docker Deployment (Recommended)

### Dockerfile (Client)
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build:secure

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Dockerfile (Server)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
USER node
EXPOSE 3001
CMD ["node", "app.js"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  client:
    build: ./client
    ports:
      - "80:80"
    read_only: true
    tmpfs:
      - /tmp
      - /var/cache/nginx
      - /var/run

  server:
    build: ./server
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    read_only: true
    tmpfs:
      - /tmp
```

## 🔍 Security Validation Checklist

Before deploying to production, verify:

### Client Security
- [ ] `npm run validate` passes without errors
- [ ] No console.log statements in built files
- [ ] Source maps are disabled
- [ ] Code is obfuscated and minified
- [ ] Rate limiting works in browser

### Server Security  
- [ ] `NODE_ENV=production` is set
- [ ] Security headers are active
- [ ] Rate limiting is functional
- [ ] Error messages don't expose sensitive info
- [ ] Request validation blocks malicious input

### Network Security
- [ ] HTTPS is enabled (use reverse proxy like Nginx)
- [ ] WebSocket connections use WSS in production
- [ ] CORS is configured for your domain only
- [ ] Firewall rules are properly configured

## 🚨 Security Monitoring

### Log Monitoring
Monitor these events in production:
```bash
# Rate limit violations
grep "Rate limit blocked" /var/log/silencium.log

# Suspicious requests
grep "Suspicious request blocked" /var/log/silencium.log

# Screenshot detection
grep "Screenshot detected" /var/log/silencium.log
```

### Alerts Setup
Set up alerts for:
- High number of rate limit violations
- Suspicious request patterns
- Server errors or crashes
- Unusual traffic patterns

## 🔧 Maintenance

### Regular Updates
```bash
# Update dependencies (check for security updates)
npm audit
npm update

# Rebuild with latest security features
npm run build:secure
```

### Security Patches
- Monitor Node.js security advisories
- Update dependencies regularly
- Test security features after updates

## 🆘 Troubleshooting

### Build Validation Fails
```bash
# Check what debug code remains
npm run validate

# Common issues:
# - console.log in dependencies (whitelist them)
# - Comments in vendor files (expected)
# - Debugger statements in development code
```

### Rate Limiting Issues
```bash
# Check server logs
tail -f /var/log/silencium.log

# Test rate limits
curl -X POST http://localhost:3001/create-room
# (repeat rapidly to trigger rate limit)
```

### Security Headers Missing
```bash
# Verify NODE_ENV is set
echo $NODE_ENV

# Check if middleware is loaded
curl -I http://localhost:3001/
```

## 📞 Support

If you encounter security issues:
1. **DO NOT** create public GitHub issues for security vulnerabilities
2. Contact the development team privately
3. Provide detailed reproduction steps
4. Include server logs (sanitized of sensitive data)

---

**Remember**: Security is an ongoing process. Regularly review and update your security measures, monitor for new threats, and keep all dependencies updated.