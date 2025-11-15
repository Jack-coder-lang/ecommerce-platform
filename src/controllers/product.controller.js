// backend/src/controllers/product.controller.js
import prisma from '../config/database.js';
import { 
  CATEGORIES, 
  CATEGORY_ATTRIBUTES, 
  CATEGORY_LABELS,
  calculateShippingFee 
} from '../constants/productAttributes.js';

class ProductController {
  /**
   * Créer un nouveau produit (Seller)
   */
  async createProduct(req, res) {
    try {
      // 🔥 VÉRIFICATION: S'assurer que req.user existe
      if (!req.user || !req.user.id) {
        console.error('❌ req.user non défini - Middleware auth non exécuté');
        return res.status(401).json({
          message: 'Non authentifié - req.user manquant',
          debug: {
            hasReqUser: !!req.user,
            reqUser: req.user
          }
        });
      }

      const sellerId = req.user.id;
      const {
        name,
        description,
        price,
        stock,
        category,
        images,
        attributes,
        weight,
        dimensions,
        // brand, // Retiré - n'existe pas dans schéma Prisma
        shippingFee // Accepter shippingFee du frontend
      } = req.body;

      // Validation de la catégorie
      if (!CATEGORIES[category]) {
        return res.status(400).json({
          message: 'Catégorie invalide',
          validCategories: Object.keys(CATEGORIES),
        });
      }

      // 🔥 MODIFICATION: Les attributs sont optionnels pour la création simple
      // Validation des attributs obligatoires seulement si des attributs sont fournis
      if (attributes && Object.keys(attributes).length > 0) {
        const requiredAttrs = CATEGORY_ATTRIBUTES[category]?.required || [];
        const missingAttrs = requiredAttrs.filter(attr => !attributes?.[attr]);

        if (missingAttrs.length > 0) {
          console.warn(`⚠️ Attributs manquants pour ${category}:`, missingAttrs);
          // Ne pas bloquer, juste logger un warning
        }
      }

      // 🔥 MODIFICATION: Utiliser shippingFee du frontend ou calculer automatiquement
      const finalShippingFee = shippingFee !== undefined
        ? parseFloat(shippingFee)
        : (weight ? calculateShippingFee(weight, 'STANDARD') : 1000); // Default 1000 FCFA

      // Gérer les dimensions comme JSON
      let dimensionsJson = null;
      if (dimensions) {
        try {
          dimensionsJson = typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions;
        } catch (error) {
          console.warn('Format de dimensions invalide, utilisation null');
        }
      }

      const product = await prisma.product.create({
        data: {
          name,
          description,
          price: parseFloat(price),
          stock: parseInt(stock),
          category,
          images: images || [],
          attributes: attributes || {}, // Attributs optionnels
          weight: weight ? parseFloat(weight) : null,
          dimensions: dimensionsJson,
          shippingFee: finalShippingFee, // 🔥 Utiliser finalShippingFee
          sellerId,
          // brand retiré - n'existe pas dans le schéma Prisma
        },
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      res.status(201).json({
        message: 'Produit créé avec succès!',
        product,
      });
    } catch (error) {
      console.error('Erreur création produit:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la création du produit.', 
        error: error.message 
      });
    }
  }

  /**
   * Obtenir tous les produits (avec filtres et pagination)
   */
  async getProducts(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        category, 
        search, 
        minPrice, 
        maxPrice, 
        sortBy = 'createdAt', 
        order = 'desc' 
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // Construire les filtres
      const where = {
        isActive: true,
      };

      if (category && category !== 'all') {
        where.category = category;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = parseFloat(minPrice);
        if (maxPrice) where.price.lte = parseFloat(maxPrice);
      }

      // Déterminer le tri
      let orderBy = {};
      if (sortBy === 'price') {
        orderBy = { price: order.toLowerCase() };
      } else if (sortBy === 'name') {
        orderBy = { name: order.toLowerCase() };
      } else {
        orderBy = { createdAt: order.toLowerCase() };
      }

      // Récupérer les produits
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            seller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            reviews: {
              select: {
                rating: true,
              },
            },
          },
        }),
        prisma.product.count({ where }),
      ]);

      // Calculer la note moyenne pour chaque produit
      const productsWithRatings = products.map((product) => {
        const avgRating = product.reviews.length > 0
          ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
          : 0;

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          images: product.images,
          stock: product.stock,
          isActive: product.isActive,
          attributes: product.attributes,
          weight: product.weight,
          dimensions: product.dimensions,
          shippingFee: product.shippingFee,
          // brand: product.brand, // Retiré
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          seller: product.seller,
          averageRating: parseFloat(avgRating.toFixed(1)),
          reviewCount: product.reviews.length,
          categoryLabel: CATEGORY_LABELS[product.category] || product.category,
        };
      });

      res.status(200).json({
        products: productsWithRatings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / take),
          totalItems: total,
          itemsPerPage: take,
        },
      });
    } catch (error) {
      console.error('Erreur récupération produits:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la récupération des produits.', 
        error: error.message 
      });
    }
  }

  /**
   * Obtenir un produit par ID
   */
  async getProductById(req, res) {
    try {
      const { productId } = req.params;

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          reviews: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!product) {
        return res.status(404).json({ message: 'Produit non trouvé.' });
      }

      // Calculer la note moyenne
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0;

      res.status(200).json({
        product: {
          ...product,
          averageRating: parseFloat(avgRating.toFixed(1)),
          reviewCount: product.reviews.length,
          categoryLabel: CATEGORY_LABELS[product.category] || product.category,
        },
      });
    } catch (error) {
      console.error('Erreur récupération produit:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la récupération du produit.', 
        error: error.message 
      });
    }
  }

  /**
   * Mettre à jour un produit (Seller)
   */
  async updateProduct(req, res) {
    try {
      const { productId } = req.params;
      const {
        name,
        description,
        price,
        stock,
        category,
        images,
        isActive,
        attributes,
        weight,
        dimensions
        // brand // Retiré - n'existe pas dans schéma Prisma
      } = req.body;

      // Vérifier que le produit existe
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return res.status(404).json({ message: 'Produit non trouvé.' });
      }

      // Vérifier les permissions
      if (product.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ 
          message: 'Vous n\'êtes pas autorisé à modifier ce produit.' 
        });
      }

      // Recalculer les frais de livraison si le poids change
      const newWeight = weight !== undefined ? parseFloat(weight) : product.weight;
      const shippingFee = newWeight ? calculateShippingFee(newWeight, 'STANDARD') : product.shippingFee;

      // Gérer les dimensions comme JSON
      let dimensionsJson = product.dimensions;
      if (dimensions !== undefined) {
        if (dimensions) {
          try {
            dimensionsJson = typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions;
          } catch (error) {
            console.warn('Format de dimensions invalide, conservation ancienne valeur');
          }
        } else {
          dimensionsJson = null;
        }
      }

      // Mettre à jour le produit
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
          ...(name && { name }),
          ...(description && { description }),
          ...(price !== undefined && { price: parseFloat(price) }),
          ...(stock !== undefined && { stock: parseInt(stock) }),
          ...(category && { category }),
          ...(images && { images }),
          ...(isActive !== undefined && { isActive }),
          ...(attributes && { attributes }),
          ...(weight !== undefined && { weight: parseFloat(weight) }),
          ...(dimensions !== undefined && { dimensions: dimensionsJson }),
          // ...(brand !== undefined && { brand }), // Retiré
          shippingFee,
        },
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      res.status(200).json({
        message: 'Produit mis à jour avec succès!',
        product: updatedProduct,
      });
    } catch (error) {
      console.error('Erreur mise à jour produit:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la mise à jour du produit.', 
        error: error.message 
      });
    }
  }

  /**
   * Supprimer un produit (Seller)
   */
  async deleteProduct(req, res) {
    try {
      const { productId } = req.params;

      // Vérifier que le produit existe
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return res.status(404).json({ message: 'Produit non trouvé.' });
      }

      if (product.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ 
          message: 'Vous n\'êtes pas autorisé à supprimer ce produit.' 
        });
      }

      await prisma.product.delete({
        where: { id: productId },
      });

      res.status(200).json({ message: 'Produit supprimé avec succès.' });
    } catch (error) {
      console.error('Erreur suppression produit:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la suppression du produit.', 
        error: error.message 
      });
    }
  }

  /**
   * Obtenir les produits du vendeur connecté
   */
  async getSellerProducts(req, res) {
    try {
      const products = await prisma.product.findMany({
        where: { sellerId: req.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      });

      const productsWithRatings = products.map((product) => {
        const avgRating = product.reviews.length > 0
          ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
          : 0;

        return {
          ...product,
          averageRating: parseFloat(avgRating.toFixed(1)),
          reviewCount: product.reviews.length,
          categoryLabel: CATEGORY_LABELS[product.category] || product.category,
        };
      });

      res.status(200).json({ products: productsWithRatings });
    } catch (error) {
      console.error('Erreur récupération produits vendeur:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la récupération des produits.', 
        error: error.message 
      });
    }
  }

  /**
   * Ajouter un avis sur un produit
   */
  async addReview(req, res) {
    try {
      const { productId } = req.params;
      const { rating, comment } = req.body;

      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return res.status(404).json({ message: 'Produit non trouvé.' });
      }

      // Vérifier si l'utilisateur a déjà noté ce produit
      const existingReview = await prisma.review.findUnique({
        where: {
          productId_userId: {
            productId,
            userId: req.user.id,
          },
        },
      });

      let review;

      if (existingReview) {
        // Mettre à jour l'avis existant
        review = await prisma.review.update({
          where: { id: existingReview.id },
          data: {
            rating: parseInt(rating),
            comment,
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        });
      } else {
        // Créer un nouvel avis
        review = await prisma.review.create({
          data: {
            productId,
            userId: req.user.id,
            rating: parseInt(rating),
            comment,
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        });
      }

      res.status(200).json({
        message: existingReview ? 'Avis mis à jour avec succès!' : 'Avis ajouté avec succès!',
        review,
      });
    } catch (error) {
      console.error('Erreur ajout avis:', error);
      res.status(500).json({ 
        message: 'Erreur lors de l\'ajout de l\'avis.', 
        error: error.message 
      });
    }
  }

  /**
   * Obtenir les attributs disponibles pour une catégorie
   */
  async getCategoryAttributes(req, res) {
    try {
      const { category } = req.params;

      if (!CATEGORIES[category]) {
        return res.status(400).json({ 
          message: 'Catégorie invalide',
          validCategories: Object.keys(CATEGORIES),
        });
      }

      const attributes = CATEGORY_ATTRIBUTES[category] || {};

      res.status(200).json({
        category,
        label: CATEGORY_LABELS[category],
        attributes,
      });
    } catch (error) {
      console.error('Erreur récupération attributs:', error);
      res.status(500).json({ 
        message: 'Erreur serveur', 
        error: error.message 
      });
    }
  }

  /**
   * Obtenir toutes les catégories disponibles
   */
  async getCategories(req, res) {
    try {
      const categories = Object.keys(CATEGORIES).map(key => ({
        value: key,
        label: CATEGORY_LABELS[key],
        attributes: CATEGORY_ATTRIBUTES[key] || {},
      }));

      res.status(200).json({ categories });
    } catch (error) {
      console.error('Erreur récupération catégories:', error);
      res.status(500).json({ 
        message: 'Erreur serveur', 
        error: error.message 
      });
    }
  }

  /**
   * Calculer les frais de livraison
   */
  async calculateShipping(req, res) {
    try {
      const { productIds, method = 'STANDARD' } = req.body;

      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
        },
        select: {
          id: true,
          name: true,
          weight: true,
          shippingFee: true,
        },
      });

      const totalWeight = products.reduce((sum, p) => sum + (p.weight || 0), 0);
      const shippingFee = calculateShippingFee(totalWeight, method);

      res.status(200).json({
        totalWeight,
        shippingFee,
        method,
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          weight: p.weight,
          individualFee: p.shippingFee,
        })),
      });
    } catch (error) {
      console.error('Erreur calcul livraison:', error);
      res.status(500).json({ 
        message: 'Erreur serveur', 
        error: error.message 
      });
    }
  }
}

export default new ProductController();