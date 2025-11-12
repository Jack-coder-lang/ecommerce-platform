// backend/routes/order.routes.js
import express from 'express';
import orderController from '../controllers/order.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// ⚠️ Routes spécifiques EN PREMIER
router.get('/seller/my-orders', authenticate, authorize('SELLER', 'ADMIN'), orderController.getSellerOrders);

// Routes client
router.post('/', authenticate, orderController.createOrder);
router.get('/', authenticate, orderController.getUserOrders);

// Routes avec paramètres dynamiques EN DERNIER
router.get('/:orderId', authenticate, orderController.getOrderById);
router.patch('/:orderId/cancel', authenticate, orderController.cancelOrder);
router.patch('/:orderId/status', authenticate, authorize('SELLER', 'ADMIN'), orderController.updateOrderStatus);

export default router;