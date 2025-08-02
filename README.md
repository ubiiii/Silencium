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
   git clone https://github.com/yourusername/silencium.git
   cd silencium
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

   # Start the client (from client directory)
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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Libsodium** for cryptographic operations
- **Socket.io** for real-time communication
- **React** for the UI framework
- **Tailwind CSS** for styling

## 📞 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check the troubleshooting section
- Review the console logs for error messages

---

**🔒 Built with privacy and security in mind. No data, no accounts, no logs.** 