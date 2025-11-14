// src/routes/payment.routes.js
import express from 'express';
import {
  initializePayment,
  checkPaymentStatus,
  handleNotification,
  getPayments
} from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/payments/cinetpay/initialize
 * @desc    Initialiser un paiement CinetPay
 * @access  Private
 */
router.post('/cinetpay/initialize', authenticate, initializePayment);

/**
 * @route   GET /api/payments/cinetpay/check/:transactionId
 * @desc    Vérifier le statut d'un paiement
 * @access  Private
 */
router.get('/cinetpay/check/:transactionId', authenticate, checkPaymentStatus);

/**
 * @route   POST /api/payments/cinetpay/notify
 * @desc    Webhook de notification CinetPay (pas d'auth car appelé par CinetPay)
 * @access  Public
 */
router.post('/cinetpay/notify', handleNotification);

/**
 * @route   GET /api/payments
 * @desc    Liste des paiements de l'utilisateur
 * @access  Private
 */
router.get('/', authenticate, getPayments);

export default router;
