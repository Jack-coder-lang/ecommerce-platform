// backend/src/controllers/profile.controller.js
import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';

class ProfileController {
  async getProfile(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      res.status(200).json({ user });
    } catch (error) {
      console.error('Erreur récupération profil:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const { firstName, lastName, phone, email } = req.body;
      const userId = req.user.id;

      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: { email, id: { not: userId } },
        });

        if (existingUser) {
          return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone && { phone }),
          ...(email && { email }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.status(200).json({
        message: 'Profil mis à jour avec succès',
        user: updatedUser,
      });
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          message: 'Mot de passe actuel et nouveau mot de passe requis' 
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ 
          message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' 
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      res.status(200).json({ message: 'Mot de passe modifié avec succès' });
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }

  async deleteAccount(req, res) {
    try {
      const { password } = req.body;
      const userId = req.user.id;

      if (!password) {
        return res.status(400).json({ message: 'Mot de passe requis pour confirmer' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Mot de passe incorrect' });
      }

      await prisma.user.delete({
        where: { id: userId },
      });

      res.status(200).json({ message: 'Compte supprimé avec succès' });
    } catch (error) {
      console.error('Erreur suppression compte:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }

  async getProfileStats(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      // Retourner des stats vides par défaut (à activer quand les tables Order et Review existent)
      if (userRole === 'BUYER') {
        return res.status(200).json({
          stats: {
            totalOrders: 0,
            totalSpent: 0,
            totalReviews: 0,
          },
        });
      } else if (userRole === 'SELLER') {
        return res.status(200).json({
          stats: {
            totalProducts: 0,
            totalOrders: 0,
            totalRevenue: 0,
            totalReviews: 0,
            averageRating: 0,
          },
        });
      }

      res.status(200).json({ stats: {} });

      // DÉCOMMENTEZ CE CODE UNE FOIS QUE LES TABLES ORDER ET REVIEW SONT CRÉÉES
      /*
      if (userRole === 'BUYER') {
        const [totalOrders, totalSpent, totalReviews] = await Promise.all([
          prisma.order.count({ where: { userId } }),
          prisma.order.aggregate({
            where: { userId, paymentStatus: 'PAID' },
            _sum: { total: true },
          }),
          prisma.review.count({ where: { userId } }),
        ]);

        return res.status(200).json({
          stats: {
            totalOrders,
            totalSpent: totalSpent._sum.total || 0,
            totalReviews,
          },
        });
      } else if (userRole === 'SELLER') {
        const [totalProducts, totalOrders, totalRevenue, totalReviews] = await Promise.all([
          prisma.product.count({ where: { sellerId: userId } }),
          prisma.order.count({
            where: { items: { some: { product: { sellerId: userId } } } },
          }),
          prisma.order.aggregate({
            where: {
              items: { some: { product: { sellerId: userId } } },
              paymentStatus: 'PAID',
            },
            _sum: { total: true },
          }),
          prisma.review.count({ where: { product: { sellerId: userId } } }),
        ]);

        const avgRating = await prisma.review.aggregate({
          where: { product: { sellerId: userId } },
          _avg: { rating: true },
        });

        return res.status(200).json({
          stats: {
            totalProducts,
            totalOrders,
            totalRevenue: totalRevenue._sum.total || 0,
            totalReviews,
            averageRating: avgRating._avg.rating || 0,
          },
        });
      }
      */
    } catch (error) {
      console.error('Erreur récupération stats profil:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }
}

export default new ProfileController();