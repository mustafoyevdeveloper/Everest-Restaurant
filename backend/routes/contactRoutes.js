import express from 'express';
import { 
  createContact, 
  getAllContacts, 
  getContact, 
  markAsRead, 
  updateContactStatus, 
  deleteContact,
  getUserContacts,
  replyToContact,
  getUserUnreadNotifications,
  markUserNotificationsAsRead,
  getUnreadContactCount
} from '../controllers/contactController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/', createContact);

// User routes (authenticated users)
router.get('/user/messages', protect, getUserContacts);
router.get('/user/notifications/count', protect, getUserUnreadNotifications);
router.put('/user/notifications/read', protect, markUserNotificationsAsRead);

// Admin routes
router.get('/', protect, admin, getAllContacts);
router.get('/unread-count', protect, admin, getUnreadContactCount);
router.get('/:id', protect, admin, getContact);
router.put('/:id/read', protect, admin, markAsRead);
router.put('/:id/reply', protect, admin, replyToContact);
router.put('/:id/status', protect, admin, updateContactStatus);
router.delete('/:id', protect, admin, deleteContact);

export default router; 