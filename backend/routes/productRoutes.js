import express from 'express';
import {
  getProducts,
  getProduct as getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  incrementViewCount
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getProducts).post(protect, admin, createProduct);
router.route('/stats').get(protect, admin, getProductStats);
router.route('/:id/view').post(incrementViewCount);
router
  .route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

export default router; 