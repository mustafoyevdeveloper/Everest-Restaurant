import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getUserStats
} from '../controllers/authController.js';

const router = express.Router();

// Admin routes - all require admin authentication
router.get('/', protect, admin, getAllUsers);
router.get('/stats', protect, admin, getUserStats);
router.put('/:userId/status', protect, admin, updateUserStatus);
router.delete('/:userId', protect, admin, deleteUser);

// eslint-disable-next-line no-console
// console.log('User admin routes loaded');

export default router; 