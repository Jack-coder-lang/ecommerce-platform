// backend/src/controllers/auth.controller.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

class AuthController {
  // REGISTER
  async register(req, res) {
    try {
      const { email, password, firstName, lastName, phone, role } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          message: 'Prénom, nom, email et mot de passe obligatoires',
        });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone: phone || null,
          role: role?.toUpperCase() === 'SELLER' ? 'SELLER' : 'BUYER',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      });

      await prisma.cart.create({ data: { userId: user.id } });

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      console.log(`INSCRIPTION RÉUSSIE → ${firstName} ${lastName}`);

      res.status(201).json({
        message: 'Inscription réussie !',
        user,
        token,
      });
    } catch (error) {
      console.error('Erreur inscription:', error);
      res.status(500).json({
        message: 'Erreur serveur',
        details: error.message,
      });
    }
  }

  // LOGIN
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe requis' });
      }

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      }

      // ✅ VÉRIFICATION DU STATUT :
      // - VENDEURS : doivent être APPROVED pour se connecter
      // - ACHETEURS : peuvent se connecter sans approbation
      // - ADMINS : peuvent toujours se connecter
      if (user.role === 'SELLER' && user.status !== 'APPROVED') {
        let message = 'Compte vendeur non approuvé';

        switch (user.status) {
          case 'PENDING':
            message = 'Votre compte vendeur est en attente de validation par un administrateur. Vous recevrez un email dès l\'approbation.';
            break;
          case 'REJECTED':
            message = 'Votre compte vendeur a été refusé. Contactez l\'administrateur pour plus d\'informations.';
            break;
          case 'SUSPENDED':
            message = 'Votre compte vendeur a été suspendu. Contactez l\'administrateur.';
            break;
        }

        return res.status(403).json({ message });
      }

      // Bloquer également les comptes rejetés ou suspendus (tous rôles)
      if (user.status === 'REJECTED' || user.status === 'SUSPENDED') {
        return res.status(403).json({
          message: user.status === 'REJECTED'
            ? 'Votre compte a été refusé.'
            : 'Votre compte a été suspendu.'
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: 'Connexion réussie !',
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error('Erreur login:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // GET PROFILE
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
          createdAt: true,
        },
      });

      res.json({ user });
    } catch (error) {
      console.error('Erreur getProfile:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // UPDATE PROFILE
  async updateProfile(req, res) {
    try {
      const { firstName, lastName, phone } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: { firstName, lastName, phone },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
        },
      });

      res.json({
        message: 'Profil mis à jour avec succès',
        user: updatedUser,
      });
    } catch (error) {
      console.error('Erreur updateProfile:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
}

export default new AuthController();