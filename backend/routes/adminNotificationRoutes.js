import express from 'express';
import AdminNotification from '../models/AdminNotification.js';
import User from '../models/User.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

// Helper function to get admin ID
const getAdminId = async (userId) => {
  if (userId === 'hardcoded_admin_id') {
    // Find the admin user in database
    const adminUser = await User.findOne({ email: 'everestrestaurantcook@gmail.com' });
    if (adminUser) {
      return adminUser._id;
    }
    // If admin user doesn't exist, create one
    const newAdmin = await User.create({
      name: 'ADMIN',
      email: 'everestrestaurantcook@gmail.com',
      password: '12345678!@WEB',
      role: 'admin',
      isAdmin: true,
      isActive: true
    });
    return newAdmin._id;
  }
  return userId;
};

// @desc    Get all notifications for admin
// @route   GET /api/admin/notifications
// @access  Private/Admin
const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  
  const adminId = await getAdminId(req.user._id);
  const result = await AdminNotification.getNotifications(adminId, page, limit);
  
  res.json({
    notifications: result.notifications,
    pagination: {
      page: result.page,
      totalPages: result.totalPages,
      total: result.total,
      hasNext: result.page < result.totalPages,
      hasPrev: result.page > 1
    }
  });
});

// @desc    Get unread notifications count
// @route   GET /api/admin/notifications/unread-count
// @access  Private/Admin
const getUnreadCount = asyncHandler(async (req, res) => {
  const adminId = await getAdminId(req.user._id);
  const count = await AdminNotification.getUnreadCount(adminId);
  res.json({ count });
});

// @desc    Mark notification as read
// @route   PUT /api/admin/notifications/:id/read
// @access  Private/Admin
const markAsRead = asyncHandler(async (req, res) => {
  const adminId = await getAdminId(req.user._id);
  const notification = await AdminNotification.findById(req.params.id);
  
  if (!notification) {
    res.status(404);
    throw new Error('Xabar topilmadi');
  }
  
  // Check if notification belongs to the admin
  if (notification.adminId.toString() !== adminId.toString()) {
    res.status(403);
    throw new Error('Bu xabarni o\'qish huquqiga ega emassiz');
  }
  
  notification.read = true;
  await notification.save();
  
  res.json({ message: 'Xabar o\'qilgan deb belgilandi' });
});

// @desc    Mark multiple notifications as read
// @route   PUT /api/admin/notifications/mark-read
// @access  Private/Admin
const markMultipleAsRead = asyncHandler(async (req, res) => {
  const { notificationIds } = req.body;
  
  if (!notificationIds || !Array.isArray(notificationIds)) {
    res.status(400);
    throw new Error('Xabar IDlari to\'g\'ri ko\'rsatilmagan');
  }
  
  const adminId = await getAdminId(req.user._id);
  const result = await AdminNotification.markAsRead(notificationIds, adminId);
  
  res.json({ 
    message: `${result.modifiedCount} ta xabar o\'qilgan deb belgilandi`,
    modifiedCount: result.modifiedCount
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/admin/notifications/mark-all-read
// @access  Private/Admin
const markAllAsRead = asyncHandler(async (req, res) => {
  const adminId = await getAdminId(req.user._id);
  const result = await AdminNotification.updateMany(
    { adminId, read: false },
    { read: true }
  );
  
  res.json({ 
    message: `${result.modifiedCount} ta xabar o\'qilgan deb belgilandi`,
    modifiedCount: result.modifiedCount
  });
});

// @desc    Delete notification
// @route   DELETE /api/admin/notifications/:id
// @access  Private/Admin
const deleteNotification = asyncHandler(async (req, res) => {
  const adminId = await getAdminId(req.user._id);
  const notification = await AdminNotification.findById(req.params.id);
  
  if (!notification) {
    res.status(404);
    throw new Error('Xabar topilmadi');
  }
  
  // Check if notification belongs to the admin
  if (notification.adminId.toString() !== adminId.toString()) {
    res.status(403);
    throw new Error('Bu xabarni o\'chirish huquqiga ega emassiz');
  }
  
  await notification.deleteOne();
  
  res.json({ message: 'Xabar o\'chirildi' });
});

// @desc    Delete multiple notifications
// @route   DELETE /api/admin/notifications/delete-multiple
// @access  Private/Admin
const deleteMultipleNotifications = asyncHandler(async (req, res) => {
  const { notificationIds } = req.body;
  
  if (!notificationIds || !Array.isArray(notificationIds)) {
    res.status(400);
    throw new Error('Xabar IDlari to\'g\'ri ko\'rsatilmagan');
  }
  
  const adminId = await getAdminId(req.user._id);
  const result = await AdminNotification.deleteMany({
    _id: { $in: notificationIds },
    adminId
  });
  
  res.json({ 
    message: `${result.deletedCount} ta xabar o\'chirildi`,
    deletedCount: result.deletedCount
  });
});

// @desc    Delete all notifications
// @route   DELETE /api/admin/notifications/delete-all
// @access  Private/Admin
const deleteAllNotifications = asyncHandler(async (req, res) => {
  const adminId = await getAdminId(req.user._id);
  const result = await AdminNotification.deleteMany({ adminId });
  
  res.json({ 
    message: `${result.deletedCount} ta xabar o\'chirildi`,
    deletedCount: result.deletedCount
  });
});

// @desc    Get notification statistics
// @route   GET /api/admin/notifications/stats
// @access  Private/Admin
const getNotificationStats = asyncHandler(async (req, res) => {
  const adminId = await getAdminId(req.user._id);
  const total = await AdminNotification.countDocuments({ adminId });
  const unread = await AdminNotification.countDocuments({ adminId, read: false });
  const read = total - unread;
  
  // Get counts by type
  const typeStats = await AdminNotification.aggregate([
    { $match: { adminId } },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);
  
  const stats = {
    total,
    unread,
    read,
    byType: typeStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {})
  };
  
  res.json(stats);
});

// Routes
router.get('/', protect, admin, getNotifications);
router.get('/unread-count', protect, admin, getUnreadCount);
router.get('/stats', protect, admin, getNotificationStats);
router.put('/:id/read', protect, admin, markAsRead);
router.put('/mark-read', protect, admin, markMultipleAsRead);
router.put('/mark-all-read', protect, admin, markAllAsRead);
router.delete('/:id', protect, admin, deleteNotification);
router.delete('/delete-multiple', protect, admin, deleteMultipleNotifications);
router.delete('/delete-all', protect, admin, deleteAllNotifications);

export default router; 