# 🔐 Silencium – End-to-End Encrypted, Screenshot-Proof Chatroom

**Silencium** is a real-time, ultra-private chat application built for secure, ephemeral 1-on-1 conversations. It features military-grade encryption, screenshot blocking, self-destructing sessions, and complete frontend/backend hardening — all wrapped in a hacker-style terminal UI.

> 🧠 Inspired by privacy-first principles, Silencium is secure by design — not just by patching.

---

## 🚀 Live Features

### 🔐 End-to-End Encrypted Messaging
- Uses **libsodium.js (X25519 + XSalsa20-Poly1305)** for real-time E2E encryption
- Client-only key generation and **automated public key exchange**
- No messages or images are ever stored on the server
- Shared keys derived per session → 🔑 no long-term trace

---

### 🖼️ Secure One-View Image Sharing
- Upload **JPG/PNG/GIF images up to 5MB**
- Renders using `<canvas>` to **block screenshot attempts**
- Context menu, drag & copy disabled
- Canvas blacked out on `blur`, `visibilitychange`, `PrintScreen`, and `Cmd+Shift+3/4/5`
- Zoom & pan modal for inspecting shared images without leaving the app

---

### 🛡️ Advanced Security Layers

| Feature                              | Description |
|--------------------------------------|-------------|
| ✅ **Screenshot Protection**         | Detects system screenshot attempts & blocks view |
| ✅ **Context Menu Disabled**        | Prevents right-clicking & copying sensitive media |
| ✅ **Image Upload Flood Protection** | Prevents spam or DoS by limiting upload rate |
| ✅ **Rate-Limited Messaging**       | Only 1 message per second to prevent message abuse |
| ✅ **Room UUID Hardening**          | Unpredictable 32-char room IDs prevent guessing or brute-forcing |
| ✅ **Public Key Verification (optional)** | Fingerprint-based validation to prevent MITM |
| ✅ **XSS & Input Sanitization**     | Cleans all user-generated content on server and client |
| ✅ **Buffer Limit Enforcement**     | 7MB socket buffer + server-side image validation |
| ✅ **Memory & Listener Cleanup**    | Fully cleaned on disconnect to avoid memory leaks |
| ✅ **Auto Room Destruction**        | 10-minute inactivity timer, self-deleting ephemeral rooms |

---

### ⚡ Technical Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Encryption**: Libsodium.js (via Web Workers)
- **Realtime**: Socket.IO (WebSocket)
- **Backend**: Express.js + Node.js
- **Security Tools**:
  - `vite-plugin-obfuscator` for JS hardening
  - Minified builds (no console logs in production)
  - Docker-compatible architecture (optional)
  - CSP & CORS locked

---

### 🎨 UX & UI Features

- Drk terminal UI (Orbitron / Share Tech Mono fonts)
- Matrix green-on-black color scheme
- Animated chat bubbles + system messages
- Auto-scroll, mobile responsiveness
- Full keyboard & mouse support


---
### Screenshots



---

## 🛠️ Setup

```bash
# Clone the repo
git clone https://github.com/ubiiii/Silencium
cd Silencium

# Install dependencies
cd client
npm install
cd ../server
npm install

# Run both
npm run dev     # (client)
npm run server  # (backend)
