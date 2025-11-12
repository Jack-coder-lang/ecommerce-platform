// backend/routes/analytics.routes.js
import express from 'express';
import analyticsController from '../controllers/analytics.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/seller/stats', authenticate, authorize('SELLER', 'ADMIN'), analyticsController.getSellerStats);
router.get('/seller/revenue', authenticate, authorize('SELLER', 'ADMIN'), analyticsController.getRevenueDetails);

export default router;