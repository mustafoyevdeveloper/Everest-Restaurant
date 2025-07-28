import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getAllReservations,
  updateReservationStatus,
  deleteReservation,
  getReservationStats
} from '../controllers/reservationController.js';

const router = express.Router();

// Admin routes - all require admin authentication
router.get('/', protect, admin, getAllReservations);
router.put('/:id', protect, admin, updateReservationStatus);
router.delete('/:id', protect, admin, deleteReservation);
router.get('/stats', protect, admin, getReservationStats);

// eslint-disable-next-line no-console
// console.log('Reservation admin routes loaded');

export default router; 