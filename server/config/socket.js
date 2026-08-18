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
    console.log(`New client connected: ${socket.id}`);

    // Client should emit 'authenticate' with their user ID when they connect
    socket.on('authenticate', (userId) => {
      if (userId) {
        userSockets.set(userId.toString(), socket.id);
        console.log(`User ${userId} authenticated with socket ${socket.id}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      // Remove from userSockets map
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

const emitToUser = (userId, eventName, payload) => {
  const socketId = userSockets.get(userId.toString());
  if (socketId && io) {
    io.to(socketId).emit(eventName, payload);
    return true;
  }
  return false;
};

module.exports = {
  initializeSocket,
  getIo,
  emitToUser
};
