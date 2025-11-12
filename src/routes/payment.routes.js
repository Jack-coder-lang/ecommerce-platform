// routes/payment.routes.js
const express = require('express');
const router = express.Router();
const cinetpay = require('../services/cinetpay.service');
const Order = require('../models/Order');

router.post('/create', async (req, res) => {
  try {
    const { orderId, amount, customer, returnUrl } = req.body;

    const transactionId = cinetpay.generateTransactionId();

    // Sauvegarder la commande en attente
    const order = await Order.create({
      orderId,
      transactionId,
      amount,
      customer,
      status: 'PENDING',
    });

    const payment = await cinetpay.initializePayment({
      transactionId,
      amount: Math.round(amount), // CinetPay veut un INTEGER
      description: `Paiement commande #${orderId}`,
      customerId: customer.id,
      customerName: customer.firstname,
      customerSurname: customer.lastname,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress: customer.address || '',
      customerCity: customer.city || '',
      customerCountry: customer.country || 'CI',
      returnUrl: `${returnUrl}?order=${orderId}`,
      metadata: { orderId },
    });

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;