const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store active connections
const rooms = {};
const socketToRoom = {};

app.get('/', (req, res) => {
  res.json({
    message: 'P2P Whiteboard Signaling Server is running',
    timestamp: new Date().toISOString(),
    activeRooms: Object.keys(rooms).length,
    connectedUsers: Object.keys(socketToRoom).length
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id} at ${new Date().toISOString()}`);

  // Handle room joining
  socket.on('join-room', (roomID, userID) => {
    console.log(`User ${userID} (${socket.id}) joining room ${roomID}`);
    
    if (rooms[roomID]) {
      // Only allow two users per room (teacher and student)
      const length = rooms[roomID].length;
      if (length >= 2) {
        console.log(`Room ${roomID} is full, rejecting user ${userID}`);
        socket.emit('room-full');
        return;
      }
      rooms[roomID].push({id: userID, socketId: socket.id});
    } else {
      rooms[roomID] = [{id: userID, socketId: socket.id}];
      console.log(`Created new room ${roomID}`);
    }
    
    socketToRoom[socket.id] = roomID;
    socket.join(roomID);
    
    // Get the other users in the room
    const otherUsers = rooms[roomID].filter(user => user.socketId !== socket.id);
    socket.emit('users-in-room', otherUsers);
    
    console.log(`Room ${roomID} now has ${rooms[roomID].length} users`);
  });

  // Handle signaling
  socket.on('offer', (payload) => {
    console.log(`Relaying offer from ${socket.id} to ${payload.target}`);
    io.to(payload.target).emit('offer', {
      sdp: payload.sdp,
      caller: socket.id
    });
  });

  socket.on('answer', (payload) => {
    console.log(`Relaying answer from ${socket.id} to ${payload.target}`);
    io.to(payload.target).emit('answer', {
      sdp: payload.sdp,
      answerer: socket.id
    });
  });

  socket.on('ice-candidate', (payload) => {
    console.log(`Relaying ICE candidate from ${socket.id} to ${payload.target}`);
    io.to(payload.target).emit('ice-candidate', {
      candidate: payload.candidate,
      sender: socket.id
    });
  });

  // Handle whiteboard data (fallback for non-P2P scenarios)
  socket.on('whiteboard-data', (payload) => {
    const roomID = socketToRoom[socket.id];
    if (roomID) {
      socket.to(roomID).emit('whiteboard-data', payload);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id} at ${new Date().toISOString()}`);
    const roomID = socketToRoom[socket.id];
    if (roomID) {
      let room = rooms[roomID];
      if (room) {
        room = room.filter(user => user.socketId !== socket.id);
        rooms[roomID] = room;
        if (room.length === 0) {
          delete rooms[roomID];
          console.log(`Deleted empty room ${roomID}`);
        } else {
          // Notify remaining users about the disconnection
          socket.to(roomID).emit('user-disconnected', socket.id);
        }
      }
    }
    delete socketToRoom[socket.id];
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT} at ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
}); 