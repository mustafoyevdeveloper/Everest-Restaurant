import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  createReservation,
  getMyReservations,
  cancelReservation,
  getAllReservations,
  updateReservationStatus,
  deleteReservation,
  getReservationStats
} from '../controllers/reservationController.js';

const router = express.Router();

// Protected routes (require authentication)
router.post('/', protect, createReservation);
router.get('/myreservations', protect, getMyReservations);
router.put('/:id/cancel', protect, cancelReservation);

// Admin routes
router.get('/admin', protect, admin, getAllReservations);
router.put('/admin/:id', protect, admin, updateReservationStatus);
router.delete('/admin/:id', protect, admin, deleteReservation);
router.get('/admin/stats', protect, admin, getReservationStats);

// console.log('Reservation routes loaded with admin routes:');
// console.log('- PUT /admin/:id (updateReservationStatus)');
// console.log('- DELETE /admin/:id (deleteReservation)');

export default router; 