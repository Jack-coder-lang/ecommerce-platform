// src/socket/index.js
import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
    },
  });

  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('Nouvelle connexion Socket.IO:', socket.id);

    socket.on('authenticate', (userId) => {
      connectedUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.emit('authenticated');
      console.log(`Utilisateur ${userId} authentifié sur socket ${socket.id}`);
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
      }
      console.log('Utilisateur déconnecté:', socket.id);
    });
  });

  // Fonction pour envoyer une notif à un user précis
  io.emitToUser = (userId, event, data) => {
    const socketId = connectedUsers.get(userId);
    if (socketId) {
      io.to(socketId).emit(event, data);
    }
  };
};

export { io };