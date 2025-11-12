import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import prisma from './config/database.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import profileRoutes from './routes/profile.routes.js';


dotenv.config();

const app = express();
const httpServer = createServer(app);
  

// Origines autorisées pour le frontend (comma-separated in env, e.g. "http://localhost:5173,http://localhost:5174")
const FRONTEND_URLS = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(s => s.trim()).filter(Boolean);

// Log allowed origins at startup to help debugging CORS
console.log('Allowed FRONTEND_URLS:', FRONTEND_URLS);

// Middleware CORS pour Express - accepter dynamiquement les origins listées
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests like Postman (no origin)
    if (!origin) return callback(null, true);
    if (FRONTEND_URLS.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration Socket.IO pour les notifications en temps réel
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Socket.IO may pass undefined origin for non-browser clients
      if (!origin) return callback(null, true);
      if (FRONTEND_URLS.includes(origin)) return callback(null, true);
      return callback(new Error(`Socket.IO CORS: origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Rendre io accessible dans toutes les routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/profile', profileRoutes);

// Route de base
app.get('/', (req, res) => {
  res.json({
    message: 'API E-commerce - Backend actif',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      cart: '/api/cart',
      orders: '/api/orders',
      notifications: '/api/notifications',
    },
  });
});

// Route webhook CinetPay
app.post('/api/payments/notify', async (req, res) => {
  try {
    console.log('Notification CinetPay reçue:', req.body);

    const { cpm_trans_id, cpm_trans_status } = req.body;

    if (cpm_trans_status === '00') {
      const order = await prisma.order.findFirst({
        where: { transactionId: cpm_trans_id },
      });

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            status: 'PROCESSING',
          },
        });

        // Émettre une notification Socket.IO
        io.to(order.userId).emit('payment-success', {
          orderId: order.id,
          orderNumber: order.orderNumber,
        });
      }
    }

    res.status(200).json({ message: 'Notification traitée' });

  } catch (error) {
    console.error('Erreur traitement notification:', error);
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gestion globale des erreurs
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  res.status(500).json({
    message: 'Erreur serveur interne',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
});

// Socket.IO - Gestion des connexions
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('Nouvelle connexion Socket.IO:', socket.id);

  // Authentification de l'utilisateur
  socket.on('authenticate', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.join(userId);
    console.log(`Utilisateur ${userId} authentifié sur socket ${socket.id}`);
  });

  // Déconnexion
  socket.on('disconnect', () => {
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`Utilisateur ${userId} déconnecté`);
        break;
      }
    }
  });
});

// Export de la fonction pour émettre des notifications
export const emitNotification = (userId, notification) => {
  io.to(userId).emit('notification', notification);
};

// Démarrage du serveur
const PORT = process.env.PORT || 5000;

// APRÈS (compatible Render)
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`╔════════════════════════════════════════════╗
             ║   🚀 Serveur E-commerce démarré            ║
             ║   📡 Port: ${PORT}                         ║
             ║   🌍 URL: http://0.0.0.0:${PORT}           ║
             ║   🔌 Socket.IO: Activé                     ║
             ║   📦 Base de données: Connectée            ║
             ╚════════════════════════════════════════════╝
  `);
  console.log(`✅ Server listening on 0.0.0.0:${PORT} - Ready for Render`);
});

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n🔴 Arrêt du serveur...');
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

export default app;