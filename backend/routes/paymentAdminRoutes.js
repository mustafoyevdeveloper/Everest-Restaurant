import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getPaymentStats, getRecentPayments, getAllPayments } from '../controllers/paymentController.js';
import PaymentNotificationService from '../utils/paymentNotification.js';
import Payment from '../models/Payment.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

// Get all payment notifications for admin
router.get('/notifications', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, paymentMethod, type } = req.query;
  
  const query = {};
  
  if (status) query.status = status;
  if (paymentMethod) query.paymentMethod = paymentMethod;
  if (type) query.type = type;
  
  const notifications = await PaymentNotificationService.getAdminNotifications(
    parseInt(limit, 10),
    parseInt(page, 10)
  );
  
  // eslint-disable-next-line no-console
  // console.log('Payment notifications retrieved:', notifications);
  
  res.json({
    success: true,
    data: notifications
  });
}));

// Get unread payment notifications count
router.get('/notifications/unread-count', protect, asyncHandler(async (req, res) => {
  const count = await PaymentNotificationService.getUnreadCount();
  
  res.json({
    success: true,
    count
  });
}));

// Mark notifications as read
router.put('/notifications/mark-read', protect, asyncHandler(async (req, res) => {
  const { paymentIds } = req.body;
  
  if (!paymentIds || !Array.isArray(paymentIds)) {
    res.status(400);
    throw new Error('Payment IDs array is required');
  }
  
  await PaymentNotificationService.markAsRead(paymentIds);
  
  res.json({
    success: true,
    message: 'Notifications marked as read'
  });
}));

// Get payment statistics
router.get('/stats', protect, admin, getPaymentStats);

// Get recent payments (last 10)
router.get('/recent', protect, admin, getRecentPayments);

// Get all payments
router.get('/', protect, admin, getAllPayments);

// Get payment by ID
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('referenceId');
  
  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }
  
  res.json({
    success: true,
    data: payment
  });
}));

// Delete payment
router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  
  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }
  
  await Payment.findByIdAndDelete(req.params.id);
  
  res.json({
    success: true,
    message: 'Payment deleted successfully'
  });
}));

// Update payment status
router.put('/:id/status', protect, admin, asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  const payment = await Payment.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).populate('user', 'name email phone');
  
  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }
  
  res.json({
    success: true,
    data: payment,
    message: 'Payment status updated successfully'
  });
}));

export default router; 