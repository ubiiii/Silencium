# 🔐 Silencium

**Secure, ephemeral, end-to-end encrypted messaging with a hacker aesthetic.**

Silencium is a real-time messaging application that prioritizes security and privacy. Built with modern web technologies, it provides end-to-end encryption, ephemeral messaging, and a distinctive terminal-style interface.

![Silencium Demo](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![License](https://img.shields.io/badge/License-ISC-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-19.1.0-blue)

## ✨ Features

### 🔒 Security & Privacy
- **End-to-End Encryption**: Messages are encrypted using libsodium.js with X25519 key exchange
- **Ephemeral Messaging**: No messages are stored on the server
- **Auto-Destruct**: Rooms automatically destroy after 10 minutes of inactivity
- **Canvas Image Rendering**: Images are rendered on canvas to prevent easy downloads
- **Web Worker Crypto**: Encryption operations run in background threads

### 💬 Messaging
- **Real-time Communication**: Instant messaging via Socket.IO
- **Image Sharing**: Secure image sharing with size and type validation
- **System Messages**: Automatic notifications for room events
- **Room Management**: Create and join rooms with unique IDs

### 🎨 User Experience
- **Hacker Aesthetic**: Dark terminal-style interface with green text
- **Mobile Responsive**: Works seamlessly on mobile devices
- **Auto-scroll**: Messages automatically scroll to bottom
- **Copy Link**: Easy room sharing functionality

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ubiiii/Silencium.git
   cd Silencium
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   
   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Start the development servers**
   ```bash
   # Terminal 1: Start the backend server
   cd server
   node app.js
   
   # Terminal 2: Start the frontend development server
   cd client
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to access the application.

## 🏗️ Project Structure

```
Silencium/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── pages/         # Application pages
│   │   │   ├── CreateRoom.jsx
│   │   │   ├── JoinRoom.jsx
│   │   │   └── ChatRoom.jsx
│   │   ├── components/    # React components
│   │   │   └── CanvasImageRenderer.jsx
│   │   ├── crypto/        # Encryption utilities
│   │   │   ├── libs.js
│   │   │   ├── workerWrapper.js
│   │   │   └── crypto.worker.js
│   │   ├── utils/         # Utility functions
│   │   │   ├── socket.js
│   │   │   ├── constants.js
│   │   │   └── animations.js
│   │   └── src/
│   │       ├── styles/    # CSS styles
│   │       │   └── hacker-theme.css
│   │       └── hooks/     # Custom React hooks
│   │           └── useAutoScroll.js
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── server/                # Node.js backend server
│   ├── app.js            # Main server file
│   ├── rooms/            # Room management
│   │   └── roomManager.js
│   └── package.json      # Backend dependencies
├── FEATURES.md           # Feature roadmap
└── README.md            # This file
```

## 🔧 Configuration

### Environment Variables

The application uses default configurations, but you can customize:

- **Server Port**: Set `PORT` environment variable (default: 3001)
- **Client URL**: Configure in `client/src/utils/socket.js`

### Development Scripts

**Client (Frontend)**
```bash
cd client
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

**Server (Backend)**
```bash
cd server
npm start        # Start the server
```

## 🔐 Security Features

### Encryption Implementation
- **Key Exchange**: X25519 key exchange protocol
- **Message Encryption**: ChaCha20-Poly1305 for message encryption
- **Web Workers**: Crypto operations run in background threads
- **No Server Storage**: Messages are never stored on the server

### Image Security
- **Canvas Rendering**: Images rendered on HTML5 canvas
- **Right-click Prevention**: Disabled context menu on images
- **Size Validation**: 5MB maximum file size
- **Type Validation**: Only JPG, PNG, GIF allowed

### Room Security
- **Ephemeral Rooms**: Rooms auto-destroy after inactivity
- **User Limits**: Maximum 2 users per room
- **Unique IDs**: Random room ID generation
- **Connection Validation**: Socket connection validation

## 🎯 Usage

### Creating a Room
1. Visit the application homepage
2. Click "Create Chat Room"
3. Share the generated link with your contact

### Joining a Room
1. Click the shared link or enter the room ID
2. Wait for the other user to join
3. Encryption will automatically activate

### Sending Messages
- Type your message and press Enter
- Images can be attached using the paperclip button
- All messages are end-to-end encrypted

### Security Notes
- Rooms automatically destroy after 10 minutes of inactivity
- Images are rendered securely and cannot be easily downloaded
- No messages are stored on the server
- Each room supports maximum 2 users

## 🛠️ Technical Stack

### Frontend
- **React 19.1.0**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **Socket.IO Client**: Real-time communication
- **Tailwind CSS**: Utility-first CSS framework
- **libsodium-wrappers**: Cryptography library

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **Socket.IO**: Real-time bidirectional communication
- **CORS**: Cross-origin resource sharing

### Security
- **libsodium.js**: Modern cryptography library
- **Web Workers**: Background thread execution
- **Canvas API**: Secure image rendering

## 🔮 Roadmap

### Planned Features
- [ ] Auto self-destruct after 5 mins inactivity
- [ ] One-view image sharing (no download/screenshot)
- [ ] Defensive hardening against known attacks
- [ ] Partial screenshot prevention measures

### Security Enhancements
- [ ] XSS protection
- [ ] Replay attack defense
- [ ] Key fingerprint comparison
- [ ] Rate limiting and flood control

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

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

For issues, questions, or contributions, please open an issue on the repository.

---

**Built with ❤️ for secure communication** 
