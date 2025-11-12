// backend/controllers/analytics.controller.js
import prisma from '../config/database.js';

class AnalyticsController {
  /**
   * Obtenir les statistiques du vendeur
   */
  async getSellerStats(req, res) {
    try {
      const sellerId = req.user.id;
      const { period = '30' } = req.query; // 7, 30, 90, 365 jours

      const daysAgo = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Statistiques générales
      const [
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingOrders,
        totalReviews,
      ] = await Promise.all([
        // Produits actifs
        prisma.product.count({
          where: { sellerId, isActive: true },
        }),

        // Commandes totales
        prisma.order.count({
          where: {
            items: { some: { product: { sellerId } } },
            createdAt: { gte: startDate },
          },
        }),

        // Revenu total
        prisma.order.aggregate({
          where: {
            items: { some: { product: { sellerId } } },
            paymentStatus: 'PAID',
            createdAt: { gte: startDate },
          },
          _sum: { total: true },
        }),

        // Commandes en attente
        prisma.order.count({
          where: {
            items: { some: { product: { sellerId } } },
            status: 'PENDING',
          },
        }),

        // Avis totaux
        prisma.review.count({
          where: { product: { sellerId } },
        }),
      ]);

      // Note moyenne
      const avgRating = await prisma.review.aggregate({
        where: { product: { sellerId } },
        _avg: { rating: true },
      });

      // Produits les plus vendus
      const topProducts = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          product: { sellerId },
          order: { createdAt: { gte: startDate } },
        },
        _sum: { quantity: true },
        _count: { productId: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      });

      const topProductsWithDetails = await Promise.all(
        topProducts.map(async (item) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { id: true, name: true, price: true, images: true },
          });
          return {
            ...product,
            totalSold: item._sum.quantity,
            orderCount: item._count.productId,
          };
        })
      );

      // Ventes par jour (pour le graphique)
      const salesByDay = await prisma.order.groupBy({
        by: ['createdAt'],
        where: {
          items: { some: { product: { sellerId } } },
          paymentStatus: 'PAID',
          createdAt: { gte: startDate },
        },
        _sum: { total: true },
        _count: { id: true },
      });

      // Formater les ventes par jour
      const salesChart = salesByDay.map(day => ({
        date: new Date(day.createdAt).toLocaleDateString('fr-FR'),
        revenue: day._sum.total || 0,
        orders: day._count.id,
      }));

      // Statut des commandes
      const ordersByStatus = await prisma.order.groupBy({
        by: ['status'],
        where: {
          items: { some: { product: { sellerId } } },
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      });

      // Catégories les plus vendues
      const topCategories = await prisma.product.groupBy({
        by: ['category'],
        where: {
          sellerId,
          orderItems: {
            some: {
              order: { createdAt: { gte: startDate } },
            },
          },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      });

      res.status(200).json({
        stats: {
          totalProducts,
          totalOrders,
          totalRevenue: totalRevenue._sum.total || 0,
          pendingOrders,
          totalReviews,
          averageRating: avgRating._avg.rating || 0,
        },
        topProducts: topProductsWithDetails,
        salesChart,
        ordersByStatus,
        topCategories,
        period: daysAgo,
      });
    } catch (error) {
      console.error('Erreur récupération analytics:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }

  /**
   * Obtenir les revenus détaillés
   */
  async getRevenueDetails(req, res) {
    try {
      const sellerId = req.user.id;
      const { startDate, endDate } = req.query;

      const where = {
        items: { some: { product: { sellerId } } },
        paymentStatus: 'PAID',
      };

      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }

      const orders = await prisma.order.findMany({
        where,
        include: {
          items: {
            where: { product: { sellerId } },
            include: { product: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const revenueByMonth = {};
      const revenueByProduct = {};

      orders.forEach(order => {
        const month = new Date(order.createdAt).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
        });

        if (!revenueByMonth[month]) {
          revenueByMonth[month] = 0;
        }

        order.items.forEach(item => {
          const itemTotal = item.price * item.quantity;
          revenueByMonth[month] += itemTotal;

          if (!revenueByProduct[item.product.name]) {
            revenueByProduct[item.product.name] = 0;
          }
          revenueByProduct[item.product.name] += itemTotal;
        });
      });

      res.status(200).json({
        totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
        revenueByMonth,
        revenueByProduct,
        orderCount: orders.length,
      });
    } catch (error) {
      console.error('Erreur récupération revenus:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }
}

export default new AnalyticsController();