import prisma from '../config/database.js';

class CartController {
  /**
   * Obtenir le panier de l'utilisateur
   */
  async getCart(req, res) {
    try {
      const cart = await prisma.cart.findUnique({
        where: { userId: req.user.id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: true,
                  stock: true,
                  seller: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!cart) {
        return res.status(404).json({ message: 'Panier non trouvé.' });
      }

      // Calculer le total
      const total = cart.items.reduce((sum, item) => {
        return sum + item.product.price * item.quantity;
      }, 0);

      res.status(200).json({
        cart,
        total,
        itemCount: cart.items.length,
      });
    } catch (error) {
      console.error('Erreur récupération panier:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération du panier.', error: error.message });
    }
  }

  /**
   * Ajouter un article au panier
   */
  async addToCart(req, res) {
    try {
      const { productId, quantity } = req.body;

      // Vérifier si le produit existe et a du stock
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return res.status(404).json({ message: 'Produit non trouvé.' });
      }

      if (!product.isActive) {
        return res.status(400).json({ message: 'Ce produit n\'est plus disponible.' });
      }

      if (product.stock < quantity) {
        return res.status(400).json({ message: 'Stock insuffisant.', availableStock: product.stock });
      }

      // Trouver le panier de l'utilisateur
      let cart = await prisma.cart.findUnique({
        where: { userId: req.user.id },
      });

      // Si le panier n'existe pas, le créer
      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId: req.user.id },
        });
      }

      // Vérifier si l'article est déjà dans le panier
      const existingItem = await prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
      });

      let cartItem;

      if (existingItem) {
        // Mettre à jour la quantité
        const newQuantity = existingItem.quantity + quantity;

        if (product.stock < newQuantity) {
          return res.status(400).json({
            message: 'Stock insuffisant pour cette quantité.',
            availableStock: product.stock,
          });
        }

        cartItem = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
          include: {
            product: true,
          },
        });
      } else {
        // Créer un nouvel article
        cartItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
          },
          include: {
            product: true,
          },
        });
      }

      res.status(200).json({
        message: 'Article ajouté au panier!',
        cartItem,
      });
    } catch (error) {
      console.error('Erreur ajout au panier:', error);
      res.status(500).json({ message: 'Erreur lors de l\'ajout au panier.', error: error.message });
    }
  }

  /**
   * Mettre à jour la quantité d'un article
   */
  async updateCartItem(req, res) {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;

      if (quantity < 1) {
        return res.status(400).json({ message: 'La quantité doit être au moins 1.' });
      }

      // Trouver l'article
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: {
          cart: true,
          product: true,
        },
      });

      if (!cartItem) {
        return res.status(404).json({ message: 'Article non trouvé dans le panier.' });
      }

      // Vérifier que l'article appartient à l'utilisateur
      if (cartItem.cart.userId !== req.user.id) {
        return res.status(403).json({ message: 'Accès non autorisé.' });
      }

      // Vérifier le stock
      if (cartItem.product.stock < quantity) {
        return res.status(400).json({
          message: 'Stock insuffisant.',
          availableStock: cartItem.product.stock,
        });
      }

      // Mettre à jour la quantité
      const updatedItem = await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
        include: {
          product: true,
        },
      });

      res.status(200).json({
        message: 'Quantité mise à jour!',
        cartItem: updatedItem,
      });
    } catch (error) {
      console.error('Erreur mise à jour panier:', error);
      res.status(500).json({ message: 'Erreur lors de la mise à jour.', error: error.message });
    }
  }

  /**
   * Supprimer un article du panier
   */
  async removeFromCart(req, res) {
    try {
      const { itemId } = req.params;

      // Trouver l'article
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: {
          cart: true,
        },
      });

      if (!cartItem) {
        return res.status(404).json({ message: 'Article non trouvé dans le panier.' });
      }

      // Vérifier que l'article appartient à l'utilisateur
      if (cartItem.cart.userId !== req.user.id) {
        return res.status(403).json({ message: 'Accès non autorisé.' });
      }

      // Supprimer l'article
      await prisma.cartItem.delete({
        where: { id: itemId },
      });

      res.status(200).json({ message: 'Article retiré du panier.' });
    } catch (error) {
      console.error('Erreur suppression panier:', error);
      res.status(500).json({ message: 'Erreur lors de la suppression.', error: error.message });
    }
  }

  /**
   * Vider le panier
   */
  async clearCart(req, res) {
    try {
      const cart = await prisma.cart.findUnique({
        where: { userId: req.user.id },
      });

      if (!cart) {
        return res.status(404).json({ message: 'Panier non trouvé.' });
      }

      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      res.status(200).json({ message: 'Panier vidé avec succès.' });
    } catch (error) {
      console.error('Erreur vidage panier:', error);
      res.status(500).json({ message: 'Erreur lors du vidage du panier.', error: error.message });
    }
  }
}

export default new CartController();
