import prisma from '../config/database.js';

class AdminController {
  // Obtenir les utilisateurs en attente
  async getPendingUsers(req, res) {
    try {
      const pendingUsers = await prisma.user.findMany({
        where: { status: 'PENDING' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ users: pendingUsers });
    } catch (error) {
      console.error('Erreur getPendingUsers:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // Obtenir tous les utilisateurs avec filtres
  async getUsers(req, res) {
    try {
      const { status, role, page = 1, limit = 10 } = req.query;
      
      const where = {};
      if (status) where.status = status;
      if (role) where.role = role;

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          rejectionReason: true,
          approvedAt: true,
          createdAt: true,
          updatedAt: true,
          approvedByUser: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      });

      const total = await prisma.user.count({ where });

      res.json({
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Erreur getUsers:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // Approuver un utilisateur
  async approveUser(req, res) {
    try {
      const { userId } = req.params;

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: req.user.id
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          approvedAt: true
        }
      });

      // Créer une notification pour l'utilisateur
      await prisma.notification.create({
        data: {
          userId: userId,
          title: 'Compte Approuvé',
          message: 'Votre compte a été approuvé. Vous pouvez maintenant vous connecter et utiliser toutes les fonctionnalités.',
          type: 'SUCCESS'
        }
      });

      console.log(`✅ UTILISATEUR APPROUVÉ → ${user.email} par ${req.user.email}`);

      res.json({ 
        message: 'Utilisateur approuvé avec succès', 
        user 
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      console.error('Erreur approveUser:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // Refuser un utilisateur
  async rejectUser(req, res) {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ message: 'La raison du refus est obligatoire' });
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'REJECTED',
          rejectionReason: reason
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          rejectionReason: true
        }
      });

      // Créer une notification pour l'utilisateur
      await prisma.notification.create({
        data: {
          userId: userId,
          title: 'Compte Refusé',
          message: `Votre compte a été refusé. Raison: ${reason}`,
          type: 'ERROR'
        }
      });

      console.log(`❌ UTILISATEUR REFUSÉ → ${user.email} par ${req.user.email}`);

      res.json({ 
        message: 'Utilisateur refusé avec succès', 
        user 
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      console.error('Erreur rejectUser:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // Suspendre un utilisateur
  async suspendUser(req, res) {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'SUSPENDED',
          rejectionReason: reason
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true
        }
      });

      // Créer une notification pour l'utilisateur
      await prisma.notification.create({
        data: {
          userId: userId,
          title: 'Compte Suspendu',
          message: reason 
            ? `Votre compte a été suspendu. Raison: ${reason}`
            : 'Votre compte a été suspendu. Contactez l\'administrateur pour plus d\'informations.',
          type: 'WARNING'
        }
      });

      console.log(`⚠️ UTILISATEUR SUSPENDU → ${user.email} par ${req.user.email}`);

      res.json({ 
        message: 'Utilisateur suspendu avec succès', 
        user 
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      console.error('Erreur suspendUser:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // Réactiver un utilisateur
  async activateUser(req, res) {
    try {
      const { userId } = req.params;

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'APPROVED',
          rejectionReason: null
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true
        }
      });

      // Créer une notification pour l'utilisateur
      await prisma.notification.create({
        data: {
          userId: userId,
          title: 'Compte Réactivé',
          message: 'Votre compte a été réactivé. Vous pouvez à nouveau vous connecter.',
          type: 'SUCCESS'
        }
      });

      console.log(`🔄 UTILISATEUR RÉACTIVÉ → ${user.email} par ${req.user.email}`);

      res.json({ 
        message: 'Utilisateur réactivé avec succès', 
        user 
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      console.error('Erreur activateUser:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // Statistiques d'administration
  async getStats(req, res) {
    try {
      const [
        totalUsers,
        pendingUsers,
        totalProducts,
        totalOrders,
        recentUsers
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'PENDING' } }),
        prisma.product.count(),
        prisma.order.count(),
        prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            createdAt: true
          }
        })
      ]);

      res.json({
        stats: {
          totalUsers,
          pendingUsers,
          totalProducts,
          totalOrders,
          approvedUsers: totalUsers - pendingUsers
        },
        recentUsers
      });
    } catch (error) {
      console.error('Erreur getStats:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
}

export default new AdminController();