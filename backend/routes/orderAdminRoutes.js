import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getAllOrders,
  updateOrderStatus,
  deleteOrder
} from '../controllers/orderController.js';

const router = express.Router();

// Admin routes - all require admin authentication
router.get('/', protect, admin, getAllOrders);
router.put('/:id/status', protect, admin, updateOrderStatus);
router.delete('/:id', protect, admin, deleteOrder);

// eslint-disable-next-line no-console
// console.log('Order admin routes loaded');

export default router; 