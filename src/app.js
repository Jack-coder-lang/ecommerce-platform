import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
import paymentRoutes from './routes/payment.routes.js';

// __dirname pour ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Origines autorisées pour le frontend
const FRONTEND_URLS = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(s => s.trim()).filter(Boolean);

console.log('Allowed FRONTEND_URLS:', FRONTEND_URLS);

// Fonction pour valider les origines CORS
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Requêtes sans origin (ex: serveur à serveur)

  // Autoriser localhost sur tous les ports (développement)
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
    return true;
  }

  // Autoriser tous les sous-domaines Vercel (previews + production)
  if (origin.endsWith('.vercel.app')) {
    return true;
  }

  // ⭐ Autoriser le domaine de production custom
  if (origin === 'https://www.charms-ci.com' || origin === 'https://charms-ci.com') {
    return true;
  }

  // Autoriser les URLs spécifiques de FRONTEND_URL
  if (FRONTEND_URLS.includes(origin)) {
    return true;
  }

  return false;
};

// Middleware CORS pour Express
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/payments', paymentRoutes);

// Routes PWA pour les icônes
app.get('/pwa-192x192.png', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'icons', 'pwa-192x192.png'));
});

app.get('/pwa-512x512.png', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'icons', 'pwa-512x512.png'));
});

// Route de base
app.get('/', (req, res) => {
  res.json({
    message: 'API E-commerce - Backend actif (Vercel Serverless)',
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

app.get('/api', (req, res) => {
  res.json({
    message: 'API E-commerce - Backend actif (Vercel Serverless)',
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

export default app;
