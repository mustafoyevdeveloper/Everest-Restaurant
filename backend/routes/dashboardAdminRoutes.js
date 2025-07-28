import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getDashboardStats, getNotifications, markSectionAsSeen } from '../controllers/dashboardController.js';

const router = express.Router();

// Admin routes - all require admin authentication
router.get('/stats', protect, admin, getDashboardStats);
router.get('/notifications', protect, admin, getNotifications);
router.post('/seen', protect, admin, markSectionAsSeen);

// eslint-disable-next-line no-console
// console.log('Dashboard admin routes loaded');

export default router; 