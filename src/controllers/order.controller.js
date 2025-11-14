import prisma from '../config/database.js';
import { sendNotification, sendBulkNotifications, NOTIFICATION_TYPES } from '../utils/notification.js';

class OrderController {
  /**
   * Créer une nouvelle commande
   */
  async createOrder(req, res) {
    try {
      const userId = req.user.id;
      const { items, shippingAddress, paymentMethod } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Le panier est vide' });
      }

      // 🔥 CORRECTION : Calculer le subtotal et total
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          return res.status(404).json({ message: `Produit ${item.productId} non trouvé` });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({
            message: `Stock insuffisant pour ${product.name}`
          });
        }

        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
        });
      }

      // Calculer les frais et total
      const shippingFee = 0; // Livraison gratuite pour l'exemple
      const total = subtotal + shippingFee;

      // Générer un numéro de commande unique
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // 🔥 CORRECTION : Créer la commande avec subtotal
      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId,
          subtotal,        // ← AJOUTÉ
          shippingFee,     // ← AJOUTÉ
          total,
          status: 'PENDING',
          paymentMethod,
          paymentStatus: paymentMethod === 'CASH' ? 'PENDING' : 'PENDING',
          shippingAddress, // Stocké en JSON
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      // Mettre à jour le stock des produits
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Vider le panier
      await prisma.cartItem.deleteMany({
        where: {
          cart: {
            userId,
          },
        },
      });

      // NOTIFICATION À L'ACHETEUR
      const io = req.app.get('io');
      await sendNotification(io, userId, {
        title: '🎉 Commande créée',
        message: `Votre commande #${order.orderNumber} a été créée avec succès. Montant: ${order.total.toLocaleString()} F`,
        type: NOTIFICATION_TYPES.ORDER_CREATED,
        relatedId: order.id,
      });

      // NOTIFICATIONS AUX VENDEURS
      const sellerIds = [...new Set(order.items.map(item => item.product.sellerId))];
      for (const sellerId of sellerIds) {
        const sellerItems = order.items.filter(item => item.product.sellerId === sellerId);
        const sellerTotal = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        await sendNotification(io, sellerId, {
          title: '📦 Nouvelle commande',
          message: `Nouvelle commande #${order.orderNumber}. Montant: ${sellerTotal.toLocaleString()} F`,
          type: NOTIFICATION_TYPES.PRODUCT_SOLD,
          relatedId: order.id,
        });
      }

      res.status(201).json({
        message: 'Commande créée avec succès',
        order,
      });
    } catch (error) {
      console.error('Erreur création commande:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }

  /**
   * Obtenir toutes les commandes de l'utilisateur
   */
  async getUserOrders(req, res) {
    try {
      const userId = req.user.id;

      const orders = await prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                  price: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ orders });
    } catch (error) {
      console.error('Erreur récupération commandes:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }

  /**
   * Obtenir une commande par ID
   */
  async getOrderById(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                  price: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({ message: 'Commande non trouvée' });
      }

      res.status(200).json({ order });
    } catch (error) {
      console.error('Erreur récupération commande:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }

  /**
   * Mettre à jour le statut d'une commande (VENDEUR)
   */
  async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      const sellerId = req.user.id;

      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          items: {
            some: {
              product: {
                sellerId,
              },
            },
          },
        },
        include: {
          user: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({ message: 'Commande non trouvée' });
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status },
      });

      const statusLabels = {
        PENDING: 'en attente',
        PROCESSING: 'en traitement',
        SHIPPED: 'expédiée',
        DELIVERED: 'livrée',
        CANCELLED: 'annulée',
      };

      const io = req.app.get('io');
      await sendNotification(io, order.userId, {
        title: '📦 Mise à jour de commande',
        message: `Votre commande #${order.orderNumber} est maintenant ${statusLabels[status]}`,
        type: NOTIFICATION_TYPES.ORDER_UPDATE,
        relatedId: order.id,
      });

      // Émettre l'événement Socket.IO seulement si disponible
      if (io && typeof io.to === 'function') {
        io.to(order.userId).emit('order-status-update', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: status,
        });
      }

      res.status(200).json({
        message: 'Statut mis à jour',
        order: updatedOrder,
      });
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }

  /**
   * Annuler une commande (CLIENT)
   */
  async cancelOrder(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({ message: 'Commande non trouvée' });
      }

      if (order.status !== 'PENDING') {
        return res.status(400).json({
          message: 'Seules les commandes en attente peuvent être annulées'
        });
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });

      // Restaurer le stock
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      const io = req.app.get('io');
      const sellerIds = [...new Set(order.items.map(item => item.product.sellerId))];

      for (const sellerId of sellerIds) {
        await sendNotification(io, sellerId, {
          title: '❌ Commande annulée',
          message: `La commande #${order.orderNumber} a été annulée par le client`,
          type: NOTIFICATION_TYPES.ORDER_UPDATE,
          relatedId: order.id,
        });
      }

      res.status(200).json({
        message: 'Commande annulée',
        order: updatedOrder,
      });
    } catch (error) {
      console.error('Erreur annulation commande:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }

  /**
   * Obtenir les commandes du vendeur
   */
  async getSellerOrders(req, res) {
    try {
      const sellerId = req.user.id;

      const orders = await prisma.order.findMany({
        where: {
          items: {
            some: {
              product: {
                sellerId,
              },
            },
          },
        },
        include: {
          items: {
            where: {
              product: {
                sellerId,
              },
            },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                  price: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ orders });
    } catch (error) {
      console.error('Erreur récupération commandes vendeur:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }
}

export default new OrderController();