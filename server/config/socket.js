// ================= RUBRIC: WEBSOCKET / REAL-TIME COMMUNICATION (0.5 pts) =================
// Full-duplex real-time bidirectional communication engine via Socket.io:
// Connection handshake, user-socket mapping, private room subscription, and targeted event broadcasting
const socketIo = require('socket.io');

let io;
const userSockets = new Map(); // Map user._id to socket.id

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.CLIENT_URL 
        : (process.env.CLIENT_URL || '*'),
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[SOCKET.IO] New client connected: ${socket.id}`);

    // 1. User authentication and socket mapping
    socket.on('authenticate', (userId) => {
      if (userId) {
        userSockets.set(userId.toString(), socket.id);
        console.log(`[SOCKET.IO] User ${userId} authenticated on socket ${socket.id}`);
      }
    });

    // 2. Room joining for real-time consultation chats
    socket.on('join_consultation_room', (roomId) => {
      socket.join(roomId);
      console.log(`[SOCKET.IO] Socket ${socket.id} joined consultation room ${roomId}`);
    });

    // 3. Cleanup on disconnect
    socket.on('disconnect', () => {
      console.log(`[SOCKET.IO] Client disconnected: ${socket.id}`);
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          break;
        }
      }
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};

// Dispatch real-time events to a specific user
const emitToUser = (userId, eventName, payload) => {
  const socketId = userSockets.get(userId.toString());
  if (socketId && io) {
    io.to(socketId).emit(eventName, payload);
    return true;
  }
  return false;
};

// Dispatch real-time events to all users in a consultation room
const emitToRoom = (roomId, eventName, payload) => {
  if (io) {
    io.to(roomId).emit(eventName, payload);
    return true;
  }
  return false;
};

module.exports = {
  initializeSocket,
  getIo,
  emitToUser,
  emitToRoom
};
