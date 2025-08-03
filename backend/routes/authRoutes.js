import express from 'express';
import {
  signup,
  login,
  logout,
  me,
  verifyCode,
  sendVerificationCode,
  updateProfile,
  checkProfileComplete,
  sendPasswordResetCode,
  verifyPasswordResetCode,
  resetPassword,
  googleAuth,
  googleAuthCallback
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/verify', verifyCode);
router.post('/send-verification-code', sendVerificationCode);
router.post('/send-password-reset-code', sendPasswordResetCode);
router.post('/verify-password-reset-code', verifyPasswordResetCode);
router.post('/reset-password', resetPassword);

// Google OAuth routes (only if credentials are available)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google', googleAuth);
  router.get('/google/callback', googleAuthCallback);
}

// Protected routes
router.get('/me', protect, me);
router.put('/profile', protect, updateProfile);
router.get('/profile/complete', protect, checkProfileComplete);

export default router;
