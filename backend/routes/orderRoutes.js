import express from 'express';
import {
    createOrder,
    getMyOrders,
    getOrder as getOrderById,
    updateOrderStatus,
    getAllOrders,
    getOrderStats,
    cancelOrder,
    deleteOrder,
    getDashboardStats
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/', protect, createOrder);

// Protected routes
router.get('/myorders', protect, getMyOrders);
router.put('/:id/cancel', protect, cancelOrder);

// Admin routes
router.get('/admin', protect, admin, getAllOrders);
router.get('/admin/:id', protect, admin, getOrderById);
router.put('/admin/:id/status', protect, admin, updateOrderStatus);
router.delete('/admin/:id', protect, admin, deleteOrder);

router.route('/stats/overview').get(protect, admin, getOrderStats);
router.route('/dashboard-stats').get(protect, admin, getDashboardStats);

export default router; 