// backend/controllers/notification.controller.js
import prisma from '../config/database.js';

class NotificationController {
  /**
   * Obtenir toutes les notifications de l'utilisateur connecté
   */
  async getNotifications(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId: req.user.id },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.notification.count({
          where: { userId: req.user.id },
        }),
      ]);

      res.status(200).json({
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
        },
      });
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }

  /**
   * Compter les notifications non lues
   */
  async getUnreadCount(req, res) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId: req.user.id,
          isRead: false,
        },
      });

      res.status(200).json({ unreadCount: count });
    } catch (error) {
      console.error('Erreur comptage notifications:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;

      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        return res.status(404).json({ message: 'Notification non trouvée' });
      }

      if (notification.userId !== req.user.id) {
        return res.status(403).json({ message: 'Non autorisé' });
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      res.status(200).json({ message: 'Notification marquée comme lue' });
    } catch (error) {
      console.error('Erreur marquage notification:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(req, res) {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: req.user.id,
          isRead: false,
        },
        data: { isRead: true },
      });

      res.status(200).json({ message: 'Toutes les notifications sont marquées comme lues' });
    } catch (error) {
      console.error('Erreur marquage notifications:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }

  /**
   * Supprimer une notification
   */
  async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;

      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        return res.status(404).json({ message: 'Notification non trouvée' });
      }

      if (notification.userId !== req.user.id) {
        return res.status(403).json({ message: 'Non autorisé' });
      }

      await prisma.notification.delete({
        where: { id: notificationId },
      });

      res.status(200).json({ message: 'Notification supprimée' });
    } catch (error) {
      console.error('Erreur suppression notification:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }

  /**
   * Créer une notification (utilisé en interne)
   */
  async createNotification(userId, type, title, message, link = null) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          link,
        },
      });

      // Émettre via Socket.IO si disponible
      const io = global.io;
      if (io && typeof io.to === 'function') {
        io.to(userId).emit('new-notification', notification);
      }

      return notification;
    } catch (error) {
      console.error('Erreur création notification:', error);
      throw error;
    }
  }
}

export default new NotificationController();