import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token manquant. Authentification requise.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true, // AJOUTÉ
        isVerified: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé.' });
    }

    // VÉRIFICATION DU STATUT DU COMPTE
    // Seuls les comptes REJETÉS ou SUSPENDUS sont bloqués
    // Les PENDING peuvent utiliser les routes (le login gère déjà les vendeurs PENDING)
    if (user.status === 'REJECTED' || user.status === 'SUSPENDED') {
      const message = user.status === 'REJECTED'
        ? 'Votre compte a été refusé. Contactez l\'administrateur.'
        : 'Votre compte a été suspendu. Contactez l\'administrateur.';

      return res.status(403).json({ message });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré.' });
    }
    res.status(500).json({ message: 'Erreur d\'authentification.', error: error.message });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé. Permissions insuffisantes.' });
    }

    next();
  };
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true, // AJOUTÉ
        },
      });
      
      // Vérifier le statut seulement si l'utilisateur existe
      if (user && user.status === 'APPROVED') {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    next();
  }
};