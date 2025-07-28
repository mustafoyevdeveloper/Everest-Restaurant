import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getAllContacts,
  getContact,
  markAsRead,
  updateContactStatus,
  deleteContact,
  getUnreadContactCount
} from '../controllers/contactController.js';

const router = express.Router();

// Admin routes - all require admin authentication
router.get('/unread-count', protect, admin, getUnreadContactCount);
router.get('/', protect, admin, getAllContacts);
router.get('/:id', protect, getContact);
router.put('/:id/read', protect, markAsRead);
router.put('/:id/status', protect, updateContactStatus);
router.delete('/:id', protect, deleteContact);

// eslint-disable-next-line no-console
// console.log('Contact admin routes loaded');

export default router; 