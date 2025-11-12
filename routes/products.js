// backend/routes/products.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, isSeller } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET tous les produits (public)
router.get('/', async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice } = req.query;

    const where = {
      stock: { gt: 0 },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const products = await prisma.product.findMany({
      where,
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
          select: {
            rating: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculer la moyenne des notes
    const productsWithRating = products.map(product => ({
      ...product,
      averageRating: product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0,
      reviewCount: product.reviews.length,
    }));

    res.json({ products: productsWithRating });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET produit par ID (public)
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
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
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Calculer la moyenne des notes
    const averageRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

    res.json({
      ...product,
      averageRating,
      reviewCount: product.reviews.length,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET produits du vendeur connecté (protégé)
router.get('/seller/my-products', authenticateToken, isSeller, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { sellerId: req.user.userId },
      include: {
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const productsWithRating = products.map(product => ({
      ...product,
      averageRating: product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0,
      reviewCount: product.reviews.length,
    }));

    res.json({ products: productsWithRating });
  } catch (error) {
    console.error('Error fetching seller products:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST créer un produit (vendeur uniquement)
router.post('/', authenticateToken, isSeller, async (req, res) => {
  try {
    const { name, description, price, stock, category, images } = req.body;

    // Validation
    if (!name || !description || !price || !stock || !category) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        images: images || [],
        sellerId: req.user.userId,
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

    res.status(201).json({ product, message: 'Produit créé avec succès' });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT mettre à jour un produit (vendeur uniquement)
router.put('/:id', authenticateToken, isSeller, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { name, description, price, stock, category, images } = req.body;

    // Vérifier que le produit appartient au vendeur
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    if (product.sellerId !== req.user.userId) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        images,
      },
    });

    res.json({ product: updatedProduct, message: 'Produit mis à jour' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE supprimer un produit (vendeur uniquement)
router.delete('/:id', authenticateToken, isSeller, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    // Vérifier que le produit appartient au vendeur
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    if (product.sellerId !== req.user.userId) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    res.json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;