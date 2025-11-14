// backend/src/utils/notification.js
import prisma from '../../config/database.js';

export const sendNotification = async (io, userId, notificationData) => {
  try {
    // Créer la notification en base de données
    const notification = await prisma.notification.create({
      data: {
        userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        relatedId: notificationData.relatedId,
      },
    });

    // Émettre via Socket.IO (seulement si disponible)
    // Sur Vercel serverless, Socket.IO n'est pas disponible
    if (io && typeof io.to === 'function') {
      io.to(userId).emit('new-notification', {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        createdAt: notification.createdAt,
      });
      console.log(`📧 Notification Socket.IO envoyée à l'utilisateur ${userId}`);
    } else {
      console.log(`📧 Notification créée pour l'utilisateur ${userId} (Socket.IO non disponible)`);
    }

    return notification;
  } catch (error) {
    console.error('Erreur envoi notification:', error);
    throw error;
  }
};

// Fonction pour notifier plusieurs utilisateurs
export const sendBulkNotifications = async (io, userIds, notificationData) => {
  try {
    const notifications = await Promise.all(
      userIds.map(userId => sendNotification(io, userId, notificationData))
    );
    return notifications;
  } catch (error) {
    console.error('Erreur envoi notifications groupées:', error);
    throw error;
  }
};

// Types de notifications disponibles
export const NOTIFICATION_TYPES = {
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_UPDATE: 'ORDER_UPDATE',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PRODUCT_SOLD: 'PRODUCT_SOLD',
  NEW_MESSAGE: 'NEW_MESSAGE',
  SYSTEM: 'SYSTEM',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  WARNING: 'WARNING',
  INFO: 'INFO',
};