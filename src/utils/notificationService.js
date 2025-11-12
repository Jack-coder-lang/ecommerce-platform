// backend/src/services/notification.service.js
import prisma from '../config/database.js';
import { io } from '../server.js';

class NotificationService {
  /**
   * Créer une notification
   */
  async create({ userId, title, message, type, relatedId = null }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          relatedId,
          isRead: false,
        },
      });

      // Envoyer en temps réel via Socket.IO
      if (io) {
        io.to(userId).emit('notification', notification);
      }

      return notification;
    } catch (error) {
      console.error('Erreur création notification:', error);
      throw error;
    }
  }

  /**
   * Notifications pour nouvelle commande (VENDEUR)
   */
  async notifyNewOrder(order) {
    // Récupérer tous les vendeurs concernés par la commande
    const sellerIds = [...new Set(order.items.map(item => item.product.sellerId))];

    for (const sellerId of sellerIds) {
      await this.create({
        userId: sellerId,
        title: '🎉 Nouvelle commande !',
        message: `Commande #${order.orderNumber} reçue. Montant : ${order.total.toLocaleString()} FCFA`,
        type: 'ORDER_CREATED',
        relatedId: order.id,
      });
    }
  }

  /**
   * Notification confirmation commande (ACHETEUR)
   */
  async notifyOrderConfirmed(order) {
    await this.create({
      userId: order.userId,
      title: '✅ Commande confirmée',
      message: `Votre commande #${order.orderNumber} a été confirmée et est en préparation.`,
      type: 'ORDER_UPDATE',
      relatedId: order.id,
    });
  }

  /**
   * Notification expédition (ACHETEUR)
   */
  async notifyOrderShipped(order) {
    await this.create({
      userId: order.userId,
      title: '🚚 Commande expédiée',
      message: `Votre commande #${order.orderNumber} est en route !`,
      type: 'ORDER_UPDATE',
      relatedId: order.id,
    });
  }

  /**
   * Notification livraison (ACHETEUR)
   */
  async notifyOrderDelivered(order) {
    await this.create({
      userId: order.userId,
      title: '🎉 Commande livrée',
      message: `Votre commande #${order.orderNumber} a été livrée. Bon shopping !`,
      type: 'ORDER_UPDATE',
      relatedId: order.id,
    });
  }

  /**
   * Notification paiement réussi
   */
  async notifyPaymentSuccess(order) {
    await this.create({
      userId: order.userId,
      title: '💳 Paiement réussi',
      message: `Paiement de ${order.total.toLocaleString()} FCFA confirmé pour la commande #${order.orderNumber}`,
      type: 'PAYMENT_SUCCESS',
      relatedId: order.id,
    });
  }

  /**
   * Notification produit en rupture de stock
   */
  async notifyLowStock(product) {
    await this.create({
      userId: product.sellerId,
      title: '⚠️ Stock faible',
      message: `Le produit "${product.name}" a un stock faible (${product.stock} restant)`,
      type: 'WARNING',
      relatedId: product.id,
    });
  }

  /**
   * Notification nouveau avis
   */
  async notifyNewReview(review, product) {
    await this.create({
      userId: product.sellerId,
      title: '⭐ Nouvel avis',
      message: `Nouvelle évaluation ${review.rating}★ sur "${product.name}"`,
      type: 'INFO',
      relatedId: product.id,
    });
  }
}

export default new NotificationService();