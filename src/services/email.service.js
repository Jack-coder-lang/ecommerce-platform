import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Envoyer un email de bienvenue
   */
  async sendWelcomeEmail(userEmail, userName) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: userEmail,
        subject: 'Bienvenue sur notre plateforme E-commerce',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Bienvenue ${userName}!</h2>
            <p>Nous sommes ravis de vous compter parmi nos membres.</p>
            <p>Vous pouvez maintenant profiter de toutes les fonctionnalités de notre plateforme:</p>
            <ul>
              <li>Acheter des produits</li>
              <li>Vendre vos propres produits</li>
              <li>Gérer vos commandes</li>
              <li>Recevoir des notifications</li>
            </ul>
            <p>Merci de nous faire confiance!</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">Cet email est automatique, merci de ne pas y répondre.</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email de bienvenue envoyé à ${userEmail}`);
    } catch (error) {
      console.error('Erreur envoi email de bienvenue:', error);
    }
  }

  /**
   * Envoyer un email de confirmation de commande
   */
  async sendOrderConfirmationEmail(userEmail, orderData) {
    try {
      const { orderNumber, totalAmount, items } = orderData;

      const itemsHtml = items
        .map(
          (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.product.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${item.price} FCFA</td>
        </tr>
      `
        )
        .join('');

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: userEmail,
        subject: `Confirmation de commande #${orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Commande confirmée!</h2>
            <p>Merci pour votre commande. Voici les détails:</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Numéro de commande:</strong> ${orderNumber}</p>
              <p><strong>Montant total:</strong> ${totalAmount} FCFA</p>
            </div>

            <h3>Articles commandés:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #4CAF50; color: white;">
                  <th style="padding: 10px; text-align: left;">Produit</th>
                  <th style="padding: 10px; text-align: center;">Quantité</th>
                  <th style="padding: 10px; text-align: right;">Prix</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <p style="margin-top: 20px;">Nous vous informerons de l'avancement de votre commande.</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">Cet email est automatique, merci de ne pas y répondre.</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email de confirmation envoyé à ${userEmail}`);
    } catch (error) {
      console.error('Erreur envoi email de confirmation:', error);
    }
  }

  /**
   * Envoyer un email de changement de statut de commande
   */
  async sendOrderStatusEmail(userEmail, orderNumber, status) {
    try {
      const statusMessages = {
        PROCESSING: 'est en cours de traitement',
        SHIPPED: 'a été expédiée',
        DELIVERED: 'a été livrée',
        CANCELLED: 'a été annulée',
      };

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: userEmail,
        subject: `Mise à jour de votre commande #${orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Mise à jour de commande</h2>
            <p>Votre commande <strong>#${orderNumber}</strong> ${statusMessages[status]}.</p>
            <p>Connectez-vous à votre compte pour plus de détails.</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">Cet email est automatique, merci de ne pas y répondre.</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email de statut envoyé à ${userEmail}`);
    } catch (error) {
      console.error('Erreur envoi email de statut:', error);
    }
  }

  /**
   * Envoyer un email de paiement réussi
   */
  async sendPaymentSuccessEmail(userEmail, orderNumber, amount) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: userEmail,
        subject: `Paiement confirmé pour la commande #${orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">✓ Paiement réussi</h2>
            <p>Votre paiement de <strong>${amount} FCFA</strong> pour la commande <strong>#${orderNumber}</strong> a été confirmé avec succès.</p>
            <p>Votre commande est maintenant en cours de traitement.</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">Cet email est automatique, merci de ne pas y répondre.</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email de paiement envoyé à ${userEmail}`);
    } catch (error) {
      console.error('Erreur envoi email de paiement:', error);
    }
  }
}

export default new EmailService();
