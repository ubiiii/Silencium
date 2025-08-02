# 🔒 Silencium - Secure Private Chat

A real-time, end-to-end encrypted chat application with self-destructing rooms and secure image sharing. Built with privacy and security as the top priority.

## ✨ Features

- **🔐 End-to-End Encryption** - All messages and images are encrypted using Libsodium
- **🚪 Self-Destructing Rooms** - Rooms are automatically destroyed when any user leaves
- **📸 Secure Image Sharing** - Encrypted image transmission with compression
- **👥 No Accounts Required** - Anonymous chat without registration
- **🗑️ No Data Storage** - Messages are never stored on the server
- **🔍 Screenshot Detection** - Built-in screenshot detection capabilities
- **⚡ Real-time Communication** - Instant message delivery via WebSocket
- **🎨 Modern UI** - Clean, terminal-inspired interface

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ubiiii/Silencium.git
   cd Silencium
   ```

2. **Install dependencies**
   ```bash
   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Start the development servers**
   ```bash
   # Start the server (from server directory)
   cd server
   node app.js
   
   # Terminal 2: Start the frontend development server
   cd client
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:5173`
   - Create a new chat room or join an existing one

## 🏗️ Project Structure

```
Silencium/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── crypto/        # Encryption utilities
│   │   └── utils/         # Utility functions
├── server/                 # Node.js backend
│   ├── app.js            # Main server file
│   └── rooms/            # Room management
└── README.md
```

## 🔧 Technology Stack

### Frontend
- **React** - UI framework
- **Socket.io Client** - Real-time communication
- **Libsodium** - End-to-end encryption
- **Tailwind CSS** - Styling
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Socket.io** - Real-time communication
- **CORS** - Cross-origin resource sharing

## 🔐 Security Features

### Encryption
- **Libsodium** for cryptographic operations
- **X25519** key exchange
- **ChaCha20-Poly1305** for authenticated encryption
- **Secure random number generation**

### Privacy
- **No user accounts** - Completely anonymous
- **No message storage** - Messages are never saved
- **Self-destructing rooms** - Automatic cleanup
- **End-to-end encryption** - Only participants can read messages

### Image Security
- **Encrypted image transmission**
- **Automatic compression** for better performance
- **Secure file handling**

## 📸 Screenshots

### Home Page
![Home Page](screenshots/home-page.png)
*Landing page with security features and create room button*

### Chat Room
![Chat Room](screenshots/chat-room.png)
*Active chat room with encrypted messaging*

### Image Sharing
![Image Sharing](screenshots/image-sharing.png)
*Secure image sharing with encryption*

### Full Screen Image Viewer
![Image Viewer](screenshots/image-viewer.png)
*Full screen image viewer with zoom and pan*

## 🚪 Room Management

### Creating a Room
1. Click "Create Chat Room" on the home page
2. Share the generated room link with your contact
3. Start chatting securely

### Joining a Room
1. Use the shared room link
2. Or manually enter the room ID
3. Connect instantly with end-to-end encryption

### Room Destruction
- Rooms are automatically destroyed when any user leaves
- All participants are notified and redirected to home
- No orphaned rooms or stuck users

## 🔧 Development

### Running in Development Mode
```bash
# Client (with hot reload)
cd client
npm run dev

# Server
cd server
node app.js
```

### Building for Production
```bash
# Build client
cd client
npm run build

# Start production server
cd server
NODE_ENV=production node app.js
```

## 🐛 Troubleshooting

### Common Issues

**Connection Failed**
- Ensure the server is running on port 3001
- Check firewall settings
- Verify network connectivity

**Encryption Issues**
- Clear browser cache and reload
- Check browser console for errors
- Ensure WebSocket connections are allowed

**Image Upload Problems**
- Check file size (max 3MB)
- Ensure image format is supported
- Clear browser cache if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## ⚠️ Disclaimer

- Screenshot prevention is limited on web platforms
- No images are stored - every asset is ephemeral and encrypted
- This is a demonstration project for secure messaging concepts
- Use at your own risk for sensitive communications

## 🐛 Troubleshooting

### Common Issues

**Connection Errors**
- Ensure the server is running on port 3001
- Check that the client is connecting to the correct server URL

**Encryption Issues**
- Clear browser cache and reload
- Ensure both users are in the same room
- Check browser console for error messages

**Image Upload Issues**
- Ensure image is under 5MB
- Check that image format is JPG, PNG, or GIF
- Try refreshing the page

### ScreenShots
<img width="399" height="870" alt="Screenshot 2025-08-02 153814" src="https://github.com/user-attachments/assets/6b20a123-7214-4587-8fa7-9c925511f02a" />
<img width="401" height="868" alt="Screenshot 2025-08-02 153836" src="https://github.com/user-attachments/assets/332e045a-bc98-479b-b8d6-721b1939dc2c" />
<img width="401" height="868" alt="Screenshot 2025-08-02 153836" src="https://github.com/user-attachments/assets/332e045a-bc98-479b-b8d6-721b1939dc2c" />
<img width="406" height="879" alt="Screenshot 2025-08-02 153929" src="https://github.com/user-attachments/assets/f3280e0e-79e6-4373-83fa-b68fcf1e32be" />
<img width="946" height="950" alt="Screenshot 2025-08-02 154039" src="https://github.com/user-attachments/assets/0b308085-8887-4dca-901a-6f873ceff52a" />
<img width="952" height="940" alt="Screenshot 2025-08-02 154046" src="https://github.com/user-attachments/assets/b5dd73b4-00c5-4339-9ed0-fb56c5970135" />
<img width="398" height="854" alt="Screenshot 2025-08-02 154150" src="https://github.com/user-attachments/assets/6887d3ff-98b8-4c00-b435-5dbf964a0029" />



## 📞 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check the troubleshooting section
- Review the console logs for error messages

## ❓ Frequently Asked Questions (FAQ)

### **🔒 Security & Privacy**

**Q: Is my data saved somewhere during transfer?**
A: **No, data is NOT saved anywhere during transfer.** Messages are encrypted on your device, sent through the server (which acts like a "mailman"), and immediately deleted after delivery. The server cannot read the encrypted messages and has no database to store them.

**Q: What encryption is used for messages and images?**
A: **Libsodium with ChaCha20-Poly1305 encryption and X25519 key exchange.** This is the same military-grade encryption used by WhatsApp, Signal, and Google Chrome. Messages are encrypted on your device before sending and only decrypted on the receiver's device.

**Q: How do you prevent middleman attacks?**
A: **End-to-end encryption with direct key exchange.** Users exchange public keys directly (peer-to-peer), generate a shared secret, and encrypt all messages with that secret. The server is "blind" - it can only pass encrypted data but cannot read, modify, or access the actual message content.

**Q: Can the server read my messages?**
A: **No, absolutely not.** The server only sees encrypted gibberish. It acts like a mailman passing locked boxes - it can deliver them but cannot open them. Only you and the other person have the keys to decrypt the messages.

**Q: What happens if someone intercepts the connection?**
A: **They would only see encrypted data.** Even if someone intercepts the network traffic, they would only see encrypted gibberish. Without the private keys (which are never sent over the network), the encrypted data is mathematically impossible to decrypt.

### **🚪 Room Management**

**Q: How do rooms work?**
A: **Self-destructing rooms with maximum 2 users.** When you create a room, you get a unique link to share. When any user leaves, the room is automatically destroyed and all remaining users are redirected to the home page.

**Q: How long do rooms last?**
A: **Until someone leaves or 10 minutes of inactivity.** Rooms are ephemeral - they exist only while users are active and are automatically cleaned up when users leave or become inactive.

**Q: Can I join a room with more than 2 people?**
A: **No, maximum 2 users per room.** This is by design for security and privacy. Each room supports exactly 2 users for end-to-end encrypted communication.

### **📸 Image Sharing**

**Q: Are images stored on the server?**
A: **No, images are never stored.** Images are encrypted, compressed, and transmitted directly between users. They are never saved to any server storage or database.

**Q: How secure is image sharing?**
A: **Fully encrypted with compression.** Images are encrypted using the same ChaCha20-Poly1305 encryption as messages, automatically compressed for better performance, and transmitted securely between users.

**Q: What image formats are supported?**
A: **JPG, PNG, GIF with maximum 3MB size.** Images are automatically compressed if they're too large and encrypted before transmission.

### **🔧 Technical**

**Q: What happens if I lose connection?**
A: **Automatic reconnection with 5-second grace period.** The app will attempt to reconnect automatically. If reconnection fails, you'll be notified and can refresh the page.

**Q: Can I use this on mobile?**
A: **Yes, fully responsive design.** The app works on all devices - desktop, tablet, and mobile with a responsive interface.

**Q: What browsers are supported?**
A: **Modern browsers with WebSocket support.** Chrome, Firefox, Safari, Edge, and other modern browsers that support WebSocket connections and the required cryptographic APIs.

**Q: Is this open source?**
A: **Yes, fully open source.** All code is available on GitHub for review, audit, and contribution. The encryption libraries used are also open source and peer-reviewed.

### **🛡️ Privacy**

**Q: Do you collect any user data?**
A: **No, zero data collection.** No accounts, no logs, no analytics, no tracking. The app is completely anonymous and doesn't collect any user information.

**Q: Can you see my messages?**
A: **No, we cannot see any messages.** The developers have no access to message content, user data, or any communication. Everything is encrypted end-to-end.

**Q: What about metadata?**
A: **Minimal metadata only.** The server only knows when users connect/disconnect and which room they're in. No message content, user identities, or communication patterns are logged.

### **🚀 Usage**

**Q: How do I start a secure chat?**
A: **Click "Create Chat Room" and share the link.** The app generates a unique room link that you can share with your contact. Both users join the same room to start encrypted communication.

**Q: What if someone gets my room link?**
A: **Only works if both users are online.** Room links only work when both users are actively in the room. If someone gets your link but you're not online, they cannot access the room.

**Q: Can I verify the other person is who I think they are?**
A: **No built-in verification.** This is a limitation of anonymous chat. For sensitive communications, consider using additional verification methods outside the app.

---

**🔒 Built with privacy and security in mind. No data, no accounts, no logs.**
