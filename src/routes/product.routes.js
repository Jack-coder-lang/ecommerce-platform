import express from 'express';
import ProductController from '../controllers/product.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Routes publiques (pas besoin d'authentification)
router.get('/', ProductController.getProducts);
router.get('/categories', ProductController.getCategories);
router.get('/categories/:category/attributes', ProductController.getCategoryAttributes);
router.get('/:productId', ProductController.getProductById);

// Routes protégées (nécessitent authentification)
router.post('/', authenticate, ProductController.createProduct);
router.put('/:productId', authenticate, ProductController.updateProduct);
router.delete('/:productId', authenticate, ProductController.deleteProduct);
router.get('/seller/products', authenticate, ProductController.getSellerProducts);
router.post('/:productId/reviews', authenticate, ProductController.addReview);
router.post('/shipping/calculate', ProductController.calculateShipping);

export default router;