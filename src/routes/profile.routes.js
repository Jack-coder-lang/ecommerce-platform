// backend/src/routes/profile.routes.js
import express from 'express';
import profileController from '../controllers/profile.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, profileController.getProfile);
router.put('/', authenticate, profileController.updateProfile);
router.post('/change-password', authenticate, profileController.changePassword);
router.delete('/', authenticate, profileController.deleteAccount);
router.get('/stats', authenticate, profileController.getProfileStats);

export default router;