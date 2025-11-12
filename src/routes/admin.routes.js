import express from 'express';
import AdminController from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Toutes les routes admin nécessitent une authentification et le rôle ADMIN
router.use(authenticate);
router.use(authorize('ADMIN'));

// Routes de gestion des utilisateurs
router.get('/users/pending', AdminController.getPendingUsers);
router.get('/users', AdminController.getUsers);
router.put('/users/:userId/approve', AdminController.approveUser);
router.put('/users/:userId/reject', AdminController.rejectUser);
router.put('/users/:userId/suspend', AdminController.suspendUser);
router.put('/users/:userId/activate', AdminController.activateUser);

// Statistiques d'administration
router.get('/stats', AdminController.getStats);

export default router;