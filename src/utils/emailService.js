const nodemailer = require('nodemailer');

// Configuration du transporteur
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Envoyer un email de bienvenue
exports.sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: `"Plateforme E-Commerce" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Bienvenue sur notre plateforme!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Bienvenue ${name}!</h2>
        <p>Merci de vous être inscrit sur notre plateforme e-commerce.</p>
        <p>Nous sommes ravis de vous compter parmi nous!</p>
        <p>Commencez dès maintenant à découvrir nos produits.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email de bienvenue envoyé');
  } catch (error) {
    console.error('Erreur envoi email:', error);
  }
};

// Envoyer une confirmation de commande
exports.sendOrderConfirmation = async (email, name, order) => {
  const mailOptions = {
    from: `"Plateforme E-Commerce" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Confirmation de commande #${order._id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Merci pour votre commande ${name}!</h2>
        <p>Votre commande #${order._id} a bien été enregistrée.</p>
        
        <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h3 style="margin-top: 0;">Détails de la commande:</h3>
          <p><strong>Total:</strong> ${order.totalPrice} FCFA</p>
          <p><strong>Statut:</strong> ${order.status}</p>
        </div>
        
        <h4>Articles commandés:</h4>
        <ul>
          ${order.orderItems.map(item => `
            <li>${item.name} - Quantité: ${item.quantity} - Prix: ${item.price} FCFA</li>
          `).join('')}
        </ul>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email de confirmation envoyé');
  } catch (error) {
    console.error('Erreur envoi email:', error);
  }
};

// Envoyer une notification de paiement
exports.sendPaymentConfirmation = async (email, name, order) => {
  const mailOptions = {
    from: `"Plateforme E-Commerce" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Paiement confirmé - Commande #${order._id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Paiement confirmé!</h2>
        <p>Bonjour ${name},</p>
        <p>Votre paiement pour la commande #${order._id} a été confirmé avec succès.</p>
        
        <div style="background: #d4edda; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #28a745;">
          <p style="margin: 0;"><strong>Montant payé:</strong> ${order.totalPrice} FCFA</p>
          <p style="margin: 10px 0 0 0;"><strong>Transaction ID:</strong> ${order.paymentResult?.transactionId || 'N/A'}</p>
        </div>
        
        <p>Votre commande sera traitée dans les plus brefs délais.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email de confirmation de paiement envoyé');
  } catch (error) {
    console.error('Erreur envoi email:', error);
  }
};

// Envoyer une notification de livraison
exports.sendShippingNotification = async (email, name, order) => {
  const mailOptions = {
    from: `"Plateforme E-Commerce" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Commande expédiée - #${order._id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #007bff;">Votre commande est en route!</h2>
        <p>Bonjour ${name},</p>
        <p>Bonne nouvelle! Votre commande #${order._id} a été expédiée.</p>
        
        <div style="background: #cce5ff; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #007bff;">
          <p style="margin: 0;"><strong>Statut:</strong> En livraison</p>
        </div>
        
        <p>Vous recevrez votre colis dans les prochains jours.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email de notification d\'expédition envoyé');
  } catch (error) {
    console.error('Erreur envoi email:', error);
  }
};
