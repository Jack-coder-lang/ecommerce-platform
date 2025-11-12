import express from 'express';
import ProductController from '../controllers/product.controller.js';

const router = express.Router();

router.get('/', ProductController.getProducts);
router.get('/categories', ProductController.getCategories);
router.get('/categories/:category/attributes', ProductController.getCategoryAttributes);
router.get('/:productId', ProductController.getProductById);
router.post('/', ProductController.createProduct);
router.put('/:productId', ProductController.updateProduct);
router.delete('/:productId', ProductController.deleteProduct);
router.get('/seller/products', ProductController.getSellerProducts);
router.post('/:productId/reviews', ProductController.addReview);
router.post('/shipping/calculate', ProductController.calculateShipping);

export default router;