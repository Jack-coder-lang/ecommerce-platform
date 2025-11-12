// src/routes/webhook.routes.js
const express = require('express');
const router = express.Router();
const CinetPayService = require('../services/CinetPayService');
const Order = require('../models/Order'); // ton modèle Mongoose

// TRÈS IMPORTANT : on désactive body-parser pour garder le raw body (signature)
router.post(
  '/cinetpay/notify',
  express.raw({ type: 'application/json' }), // ← raw body obligatoire !
  async (req, res) => {
    const rawBody = req.body.toString('utf8');
    let payload;

    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error('JSON invalide depuis CinetPay');
      return res.status(400).send('Invalid JSON');
    }

    const ip = req.ip || req.connection.remoteAddress;
    console.log(`[CinetPay IPN] Reçu de ${ip} | TID: ${payload.cpm_trans_id}`);

    // 1. VÉRIFIER LA SIGNATURE (SÉCURITÉ MAXIMALE)
    if (!CinetPayService.verifySignature(payload)) {
      console.warn('SIGNATURE INVALIDE ! Tentative de fraude ?', payload);
      return res.status(400).send('Invalid signature');
    }

    // 2. VÉRIFIER QUE C'EST UN PAIEMENT RÉUSSI
    if (payload.cpm_result !== '00') {
      console.log(`Paiement refusé/refusé | TID: ${payload.cpm_trans_id}`);
      return res.status(200).send('OK'); // toujours répondre OK
    }

    const transactionId = payload.cpm_trans_id;

    // 3. IDÉMPOTENCE : éviter les doublons
    const alreadyProcessed = await Order.findOne({
      transactionId,
      status: 'PAID',
    });

    if (alreadyProcessed) {
      console.log(`Déjà traité → TID: ${transactionId}`);
      return res.status(200).send('OK');
    }

    // 4. MARQUER LA COMMANDE COMME PAYÉE
    const updated = await Order.findOneAndUpdate(
      { transactionId },
      {
        status: 'PAID',
        paymentMethod: payload.payment_method,
        paidAt: new Date(),
        cinetpayData: payload, // sauvegarde complète pour debug
      },
      { new: true }
    );

    if (!updated) {
      console.error(`Commande introuvable ! TID: ${transactionId}`);
      // Tu peux envoyer un email d'alerte ici
      return res.status(200).send('OK');
    }

    console.log(`PAIEMENT ACCEPTÉ → Commande #${updated.orderId} | ${payload.cpm_amount} XOF`);

    // 5. OPTIONNEL : envoyer un email, déclencher livraison, etc.
    // await sendPaymentConfirmationEmail(updated.customerEmail);

    // TOUJOURS répondre 200 OK rapidement
    res.status(200).send('OK');
  }
);

module.exports = router;