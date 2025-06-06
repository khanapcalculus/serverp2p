# P2P Whiteboard Signaling Server

A WebRTC signaling server for peer-to-peer whiteboard applications. This server handles the initial connection setup between clients but does not relay actual whiteboard data - that flows directly between peers via WebRTC DataChannels.

## Features

- **WebRTC Signaling**: Handles offer/answer exchange and ICE candidate relay
- **Room Management**: Supports isolated rooms for teacher-student pairs
- **Connection Limits**: Maximum 2 users per room (teacher + student)
- **Health Monitoring**: Built-in health check endpoints
- **Graceful Shutdown**: Proper cleanup on server termination
- **CORS Support**: Configured for cross-origin requests

## API Endpoints

### HTTP Endpoints

- `GET /` - Server status and statistics
- `GET /health` - Health check endpoint

### Socket.IO Events

#### Client → Server
- `join-room` - Join a specific room
- `offer` - Send WebRTC offer to peer
- `answer` - Send WebRTC answer to peer
- `ice-candidate` - Send ICE candidate to peer
- `whiteboard-data` - Fallback data relay (for non-P2P scenarios)

#### Server → Client
- `users-in-room` - List of other users in the room
- `room-full` - Room capacity exceeded
- `offer` - Received WebRTC offer from peer
- `answer` - Received WebRTC answer from peer
- `ice-candidate` - Received ICE candidate from peer
- `user-disconnected` - Peer disconnected from room

## Deployment

### Deploy to Render.com

1. **Create a new repository** on GitHub with these files
2. **Connect to Render.com**:
   - Go to [Render.com](https://render.com)
   - Connect your GitHub account
   - Select this repository
3. **Configure the service**:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Auto-Deploy**: Yes

### Environment Variables

- `PORT` - Server port (automatically set by Render.com)

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## Usage

Once deployed, update your client application to use the signaling server URL:

```javascript
const signalingServer = 'https://your-app.onrender.com';
```

## Architecture

```
Client A (Teacher)  ←→  Signaling Server  ←→  Client B (Student)
       ↓                                            ↓
       └─────── Direct P2P Connection ──────────────┘
```

1. **Signaling Phase**: Clients connect to this server to exchange connection info
2. **P2P Phase**: Once connected, data flows directly between clients
3. **Minimal Server Load**: Server only handles initial handshake, not ongoing data

## License

MIT License 