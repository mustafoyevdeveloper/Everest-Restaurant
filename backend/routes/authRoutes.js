import express from 'express';
import { signup, login, me, logout, getUserCount, handleLoginApproval, getAllUsers, updateUserStatus, deleteUser, getUserStats, getAdminDashboardStats, updateProfile, changePassword, forgotPassword, verifyResetCode, resetPassword, sendVerificationCode, verifyCode } from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, me);
router.post('/logout', logout);

// Admin routes
router.get('/users/count', protect, admin, getUserCount);
router.post('/approve-login', protect, admin, handleLoginApproval);

// Admin user management routes
router.get('/admin/users', protect, admin, getAllUsers);
router.get('/admin/users/stats', protect, admin, getUserStats);
router.put('/admin/users/:userId/status', protect, admin, updateUserStatus);
router.delete('/admin/users/:userId', protect, admin, deleteUser);

// Admin dashboard stats
router.get('/admin/dashboard-stats', protect, admin, getAdminDashboardStats);

// Profile management
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

// Verification routes
router.post('/send-verification-code', sendVerificationCode);
router.post('/verify-code', verifyCode);

export default router;
