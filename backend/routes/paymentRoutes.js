import express from 'express';
import {
  createOrderPayment,
  createReservationPayment,
  createOrderCardPayment,
  createReservationCardPayment,
  handlePaymeWebhook,
  getPaymentStatus,
  getUserPayments,
  getAllPayments,
  getPaymentStats,
  getRecentPayments
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Public routes
router.post('/webhook/payme', handlePaymeWebhook);

// Protected routes
router.use(protect);

// User payment routes
router.post('/order', createOrderPayment);
router.post('/reservation', createReservationPayment);
router.post('/card/order', createOrderCardPayment);
router.post('/card/reservation', createReservationCardPayment);
router.get('/status/:paymentId', getPaymentStatus);
router.get('/user', getUserPayments);

// Admin routes
router.get('/admin', admin, getAllPayments);
router.get('/admin/stats', admin, getPaymentStats);
router.get('/admin/recent', admin, getRecentPayments);

export default router; 