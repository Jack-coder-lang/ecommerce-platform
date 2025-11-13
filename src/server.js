import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './config/database.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import profileRoutes from './routes/profile.routes.js';

// __dirname pour ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Origines autorisées pour le frontend
const FRONTEND_URLS = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(s => s.trim()).filter(Boolean);

console.log('Allowed FRONTEND_URLS:', FRONTEND_URLS);

// Middleware CORS pour Express
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (FRONTEND_URLS.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ⭐ SERVIR LES FICHIERS STATIQUES (AJOUT CRITIQUE)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Configuration Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
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

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/profile', profileRoutes);

// ⭐ ROUTES PWA POUR LES ICÔNES (AJOUT CRITIQUE)
app.get('/pwa-192x192.png', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'icons', 'pwa-192x192.png'));
});

app.get('/pwa-512x512.png', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'icons', 'pwa-512x512.png'));
});

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

  socket.on('authenticate', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.join(userId);
    console.log(`Utilisateur ${userId} authentifié sur socket ${socket.id}`);
  });

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

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`╔════════════════════════════════════════════╗
             ║   🚀 Serveur E-commerce démarré            ║
             ║   📡 Port: ${PORT}                         ║
             ║   🌍 URL: http://0.0.0.0:${PORT}           ║
             ║   🔌 Socket.IO: Activé                     ║
             ║   📦 Base de données: Connectée            ║
             ║   📁 Static files: public/                 ║
             ╚════════════════════════════════════════════╝
  `);
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