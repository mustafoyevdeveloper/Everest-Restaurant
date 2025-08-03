import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import { io, activeAdmins, pendingLogins } from '../server.js';
import { v4 as uuidv4 } from 'uuid';
import sendEmail from '../utils/sendEmail.js';
import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';

import dotenv from 'dotenv';

dotenv.config();

// In-memory storage for pending signups
const pendingManualSignups = new Map();

// In-memory storage for password reset codes
const pendingPasswordResets = new Map();

// In-memory storage for verification codes
const pendingVerifications = new Map();

// Clean up expired data every 10 minutes
setInterval(() => {
  const now = Date.now();
  
  // Clean up pending verifications
  for (const [email, data] of pendingVerifications.entries()) {
    if (now > data.expiresAt) {
      pendingVerifications.delete(email);
    }
  }
  
  // Clean up pending password resets
  for (const [email, data] of pendingPasswordResets.entries()) {
    if (now > data.expiresAt) {
      pendingPasswordResets.delete(email);
    }
  }
  
  // Clean up pending manual signups (24 hours)
  for (const [email, data] of pendingManualSignups.entries()) {
    if (now > data.createdAt + 24 * 60 * 60 * 1000) {
      pendingManualSignups.delete(email);
    }
  }
}, 10 * 60 * 1000); // 10 minutes

// Email template functions
const getEmailTemplate = (type, code, language = 'uz') => {
  const templates = {
    verification: {
      uz: {
        subject: 'Everest Restaurant - Email tasdiqlash',
        title: 'Email tasdiqlash',
        heading: 'Tasdiqlash kodi',
        description: 'Hisobingizni tasdiqlash uchun quyidagi kodni kiriting',
        footer: '© 2024 Everest Restaurant. Barcha huquqlar himoyalangan.'
      },
      ru: {
        subject: 'Everest Restaurant - Подтверждение email',
        title: 'Подтверждение email',
        heading: 'Код подтверждения',
        description: 'Введите код ниже для подтверждения вашего аккаунта',
        footer: '© 2024 Everest Restaurant. Все права защищены.'
      },
      en: {
        subject: 'Everest Restaurant - Email Verification',
        title: 'Email Verification',
        heading: 'Verification Code',
        description: 'Enter the code below to verify your account',
        footer: '© 2024 Everest Restaurant. All rights reserved.'
      }
    },
    passwordReset: {
      uz: {
        subject: 'Everest Restaurant - Parol tiklash kodi',
        title: 'Parol tiklash',
        heading: 'Parol tiklash kodi',
        description: 'Parolingizni tiklash uchun quyidagi kodni kiriting',
        footer: '© 2024 Everest Restaurant. Barcha huquqlar himoyalangan.'
      },
      ru: {
        subject: 'Everest Restaurant - Код сброса пароля',
        title: 'Сброс пароля',
        heading: 'Код сброса пароля',
        description: 'Введите код ниже для сброса пароля',
        footer: '© 2024 Everest Restaurant. Все права защищены.'
      },
      en: {
        subject: 'Everest Restaurant - Password Reset Code',
        title: 'Password Reset',
        heading: 'Password Reset Code',
        description: 'Enter the code below to reset your password',
        footer: '© 2024 Everest Restaurant. All rights reserved.'
      }
    }
  };

  const template = templates[type][language] || templates[type]['uz'];
  
  return {
    subject: template.subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${template.subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 1px;">Everest Restaurant</h1>
            <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">${template.title}</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px; font-weight: 500;">${template.heading}</h2>
              <p style="color: #666666; margin: 0; font-size: 16px; line-height: 1.5;">${template.description}</p>
            </div>
            
            <!-- Code Box -->
            <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 2px solid #e9ecef; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
              <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; display: inline-block; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h1 style="color: #007bff; font-size: 36px; margin: 0; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</h1>
              </div>
            </div>
            
            <!-- Info -->
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px;">${language === 'ru' ? 'Этот код действителен в течение 10 минут' : language === 'en' ? 'This code is valid for 10 minutes' : 'Bu kod 10 daqiqa muddatga amal qiladi'}</p>
              <p style="color: #999999; margin: 0; font-size: 12px;">${language === 'ru' ? 'Если вы не ожидали это сообщение, пожалуйста, проигнорируйте его' : language === 'en' ? 'If you did not expect this message, please ignore it' : 'Agar siz bu xabarni kutmaganingiz bo\'lsa, uni e\'tiborsiz qoldiring'}</p>
            </div>
            
            <!-- Security Info -->
            <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h4 style="color: #007bff; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
                ${language === 'ru' ? '🔒 Безопасность' : language === 'en' ? '🔒 Security' : '🔒 Xavfsizlik'}
              </h4>
              <p style="color: #666666; margin: 0; font-size: 12px; line-height: 1.4;">
                ${language === 'ru' 
                  ? '• Никогда не делитесь этим кодом с другими<br>• Код действителен только 10 минут<br>• Если вы не запрашивали код, немедленно смените пароль<br>• Everest Restaurant никогда не запрашивает код через приложение в телефоне'
                  : language === 'en' 
                  ? '• Never share this code with anyone<br>• Code is valid for only 10 minutes<br>• If you did not request this code, change your password immediately<br>• Everest Restaurant never asks for a code via the phone app'
                  : '• Bu kodni hech kimga bermang<br>• Kod faqat 10 daqiqa amal qiladi<br>• Agar siz kod so\'ramagan bo\'lsangiz, darhol parolni o\'zgartiring<br>• Everest Restaurant hech qachon telefon ilovasida orqali kod so\'ramaydi'
                }
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <p style="color: #666666; margin: 0; font-size: 12px;">${template.footer}</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Admin email va parolni bloklash (admin faqat login orqali kirishi mumkin)
  const adminEmail = process.env.ADMIN_EMAIL || "mustafoyevdevelopment@gmail.com";
  if (email === adminEmail) {
    res.status(403);
    throw new Error('Admin uchun ro\'yxatdan o\'tish taqiqlangan. Faqat login orqali kirishingiz mumkin.');
  }

  // Validatsiya
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Barcha maydonlar to\'ldirilishi kerak');
  }

  // Kuchli parol siyosati
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    res.status(400);
    throw new Error('Parol kamida 8 ta belgidan iborat bo\'lishi, katta harf, kichik harf, raqam va maxsus belgi bo\'lishi kerak');
  }

  // Email formati tekshirish
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Noto\'g\'ri email formati');
  }

  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    res.status(400);
    throw new Error('Bu email allaqachon ro\'yxatdan o\'tgan');
  }

  // Foydalanuvchini vaqtincha xotirada saqlash (pending)
  pendingManualSignups.set(email.toLowerCase(), {
    name,
    email: email.toLowerCase(),
    password,
    role: 'user',
    isEmailVerified: false,
    createdAt: Date.now()
  });

  // Emailga tasdiqlash kodi yuborish
  try {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    pendingVerifications.set(email.toLowerCase(), {
      code: verificationCode,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 daqiqa
      attempts: 0,
      lastSent: Date.now()
    });

    const emailTemplate = getEmailTemplate('verification', verificationCode, req.body.language || 'uz');
    await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      fromName: 'Everest Restaurant',
      html: emailTemplate.html
    });

    // Console ga ham kodni chiqaramiz (debug uchun)
    console.log(`🔐 Verification code for ${email}: ${verificationCode}`);

    res.status(200).json({
      message: 'Tasdiqlash kodi yuborildi. Emailingizni tasdiqlang.',
      email: email.toLowerCase(),
    });
  } catch (error) {
    res.status(500);
    throw new Error('Tasdiqlash kodi yuborishda xatolik yuz berdi');
  }
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // --- Hardcoded Admin Check ---
  const adminEmail = process.env.ADMIN_EMAIL || "mustafoyevdevelopment@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "12345678!@WEB";

  if (email === adminEmail && password === adminPassword) {
    // Find or create admin user in database
    let adminUser = await User.findOne({ email: adminEmail });
    
    if (!adminUser) {
      // Create admin user if it doesn't exist (avval ro'yxatdan o'tmagan bo'lsa ham)
      adminUser = await User.create({
        name: "ADMIN",
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isAdmin: true,
        isActive: true,
        isEmailVerified: true, // Admin uchun email tasdiqlangan deb hisoblanadi
        createdAt: new Date()
      });
    }
    
    const token = jwt.sign({ id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    return res.json({
      user: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        isAdmin: adminUser.role === 'admin'
      },
      token,
    });
  }
  // --- End of Hardcoded Admin Check ---
  
  // For all other users, check the database
  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // --- 2FA Admin Login Logic ---
  if (user.role === 'admin') {
    // Check if there's an active admin, and the current user is not already in the active list
    if (activeAdmins.size > 0 && !Array.from(activeAdmins.values()).some(admin => admin.userId === user._id.toString())) {
      const approvalId = uuidv4();
      // Use the first active admin's socket ID to send the request
      const firstAdminSocketId = activeAdmins.values().next().value.socketId;
      
      pendingLogins.set(approvalId, { 
        userId: user._id.toString(),
        name: user.name,
      });

      // Find the socket of the user trying to log in, to send them updates
      const pendingSocket = Array.from(io.sockets.sockets.values()).find(s => s.handshake.query.userId === user._id.toString());

      io.to(firstAdminSocketId).emit('login_approval_request', {
        approvalId,
        adminName: user.name,
      });

      if (pendingSocket) {
         pendingLogins.get(approvalId).socketId = pendingSocket.id;
      }
      
      // Send a pending status to the trying admin
      return res.status(202).json({ status: 'pending_approval', approvalId });
    }
  }
  // --- End of 2FA Logic ---

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.role === 'admin'
    },
    token,
  });
});

export const handleLoginApproval = asyncHandler(async (req, res) => {
  const { approvalId, approved } = req.body;
  const approver = req.user; 

  if (!pendingLogins.has(approvalId)) {
    return res.status(404).json({ message: 'Login request not found or expired.' });
  }

  const { userId, name, socketId } = pendingLogins.get(approvalId);

  if (approved) {
    const user = await User.findById(userId);
    if (!user) {
       return res.status(404).json({ message: 'User to be approved not found.' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    if (socketId && io.sockets.sockets.get(socketId)) {
      io.to(socketId).emit('login_approved', {
        user: { _id: user._id, name: user.name, email: user.email, role: user.role, isAdmin: user.role === 'admin' },
        token,
      });
    }
    
    res.status(200).json({ message: `Login approved for ${name}.` });
  } else {
    if (socketId && io.sockets.sockets.get(socketId)) {
      io.to(socketId).emit('login_rejected', {
        message: `Login rejected by ${approver.name}.`,
      });
    }
    res.status(200).json({ message: `Login rejected for ${name}.` });
  }

  pendingLogins.delete(approvalId);
});

export const me = asyncHandler(async (req, res) => {
  if (req.user) {
    // Always return user with password field for frontend protected route logic
    const user = await User.findById(req.user._id);
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export const logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// Send verification code
export const sendVerificationCode = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email talab qilinadi');
  }

  // Email formati tekshirish
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Noto\'g\'ri email formati');
  }

  // Foydalanuvchi mavjudligini tekshirish
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(404);
    throw new Error('Bu email bilan foydalanuvchi topilmadi');
  }

  // Rate limiting - 1 daqiqada 1 marta kod yuborish
  const existingVerification = pendingVerifications.get(email.toLowerCase());
  if (existingVerification && Date.now() - existingVerification.lastSent < 60000) {
    res.status(429);
    throw new Error('Kod yuborish uchun 1 daqiqa kutish kerak');
  }

  // 6 xonali tasdiqlash kodi yaratish
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Kodi xotiraga saqlash (10 daqiqa muddat)
  pendingVerifications.set(email.toLowerCase(), {
    code: verificationCode,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 daqiqa
    attempts: 0,
    lastSent: Date.now()
  });

  // Email yuborish
  try {
    const emailTemplate = getEmailTemplate('verification', verificationCode, req.body.language || 'uz');
    await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      fromName: 'Everest Restaurant',
      html: emailTemplate.html
    });

    res.status(200).json({ 
      message: 'Tasdiqlash kodi yuborildi',
      email: email 
    });
  } catch (error) {
    // Email yuborishda xatolik bo'lsa, kodni o'chirish
    pendingVerifications.delete(email.toLowerCase());
    res.status(500);
    throw new Error('Tasdiqlash kodi yuborishda xatolik yuz berdi');
  }
});

// Verify code
export const verifyCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    res.status(400);
    throw new Error('Email va kod talab qilinadi');
  }

  const verificationData = pendingVerifications.get(email.toLowerCase());
  
  if (!verificationData) {
    res.status(400);
    throw new Error('Tasdiqlash kodi topilmadi yoki muddati tugagan');
  }

  // Urinishlar sonini tekshirish
  if (verificationData.attempts >= 3) {
    pendingVerifications.delete(email.toLowerCase());
    res.status(400);
    throw new Error('Juda ko\'p noto\'g\'ri urinish. Yangi kod so\'rang');
  }

  // Muddati tugaganini tekshirish
  if (Date.now() > verificationData.expiresAt) {
    pendingVerifications.delete(email.toLowerCase());
    res.status(400);
    throw new Error('Tasdiqlash kodi muddati tugagan');
  }

  // Kodni tekshirish
  if (verificationData.code !== code) {
    verificationData.attempts += 1;
    pendingVerifications.set(email.toLowerCase(), verificationData);
    res.status(400);
    throw new Error('Noto\'g\'ri tasdiqlash kodi');
  }

  // Kod to'g'ri bo'lsa, uni o'chirish
  pendingVerifications.delete(email.toLowerCase());

  // Foydalanuvchini xotiradan olib, endi MongoDBga saqlash
  let user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    const pendingUser = pendingManualSignups.get(email.toLowerCase());
    if (!pendingUser) {
      res.status(404);
      throw new Error('Foydalanuvchi topilmadi yoki hali ro\'yxatdan o\'tmagan');
    }
    
    // Create user with verified email
    user = await User.create({
      ...pendingUser,
      isEmailVerified: true,
    });
    pendingManualSignups.delete(email.toLowerCase());
  } else {
    // Update existing user's email verification status
    user.isEmailVerified = true;
    await user.save();
  }

  // JWT token yaratish
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.status(200).json({
    message: 'Tasdiqlash muvaffaqiyatli',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isProfileComplete: !!(user.name && user.phone && user.email)
    },
    token,
    redirectTo: user.phone ? 'home' : 'profile' // Telefon bo'lsa home, yo'qsa profile
  });
});

export const getUserCount = asyncHandler(async (req, res) => {
  const userCount = await User.countDocuments({});
  res.json({ count: userCount });
});

// Get all users (admin only)
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, role } = req.query;
  
  const query = {};
  if (status) query.isActive = status === 'active';
  if (role) query.role = role;

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
    select: '-password' // Exclude password from response
  };

  const users = await User.paginate(query, options);
  
  res.json({
    success: true,
    data: users
  });
});

// Update user status (admin only)
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { isActive, role } = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    { isActive, role },
    { new: true, select: '-password' }
  );

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({
    success: true,
    data: user
  });
});

// Delete user (admin only)
export const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// Get user statistics (admin only)
export const getUserStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const inactiveUsers = await User.countDocuments({ isActive: false });
  const adminUsers = await User.countDocuments({ role: 'admin' });
  const regularUsers = await User.countDocuments({ role: 'user' });

  res.json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      regularUsers
    }
  });
});

// Admin dashboard statistics
export const getAdminDashboardStats = asyncHandler(async (req, res) => {
  const Order = (await import('../models/Order.js')).default;
  const Payment = (await import('../models/Payment.js')).default;
  const Product = (await import('../models/Product.js')).default;
  const User = (await import('../models/User.js')).default;

  // Total counts
  const [totalOrders, totalPayments, totalProducts, totalUsers] = await Promise.all([
    Order.countDocuments(),
    Payment.countDocuments(),
    Product.countDocuments(),
    User.countDocuments()
  ]);

  // Today stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [todayOrders, todayPayments, todayUsers] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
    Payment.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
    User.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } })
  ]);

  // Total payment amount
  const paymentsAgg = await Payment.aggregate([
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
  const totalPaymentAmount = paymentsAgg[0]?.total || 0;

  // Monthly orders/payments for last 6 months
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      start: new Date(d),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 1)
    });
  }
  const monthlyOrders = await Promise.all(months.map(async (m) =>
    Order.countDocuments({ createdAt: { $gte: m.start, $lt: m.end } })
  ));
  const monthlyPayments = await Promise.all(months.map(async (m) =>
    Payment.aggregate([
      { $match: { createdAt: { $gte: m.start, $lt: m.end } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]).then(res => res[0]?.total || 0)
  ));

  res.json({
    success: true,
    data: {
      totalOrders,
      totalPayments,
      totalProducts,
      totalUsers,
      todayOrders,
      todayPayments,
      todayUsers,
      totalPaymentAmount,
      monthly: months.map((m, i) => ({
        label: m.label,
        orders: monthlyOrders[i],
        payments: monthlyPayments[i]
      }))
    }
  });
});

// Update user profile (phone number)
export const updateProfile = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    res.status(400);
    throw new Error('Telefon raqam talab qilinadi');
  }

  // Telefon raqam formati tekshirish
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  if (!phoneRegex.test(phone)) {
    res.status(400);
    throw new Error('Noto\'g\'ri telefon raqam formati');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('Foydalanuvchi topilmadi');
  }

  // Telefon raqamni yangilash
  user.phone = phone;
  await user.save();

  res.status(200).json({
    message: 'Profil muvaffaqiyatli yangilandi',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isProfileComplete: !!(user.name && user.phone && user.email)
    },
    redirectTo: 'home' // Profil to'liq bo'lganda home ga o'tkazish
  });
});

// Check if user profile is complete
export const checkProfileComplete = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('Foydalanuvchi topilmadi');
  }

  const isComplete = !!(user.name && user.phone && user.email);
  
  res.status(200).json({
    isProfileComplete: isComplete,
    missingFields: []
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  // Validatsiya
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Barcha maydonlar to\'ldirilishi kerak');
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak');
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('Foydalanuvchi topilmadi');
  }

  // Joriy parolni tekshirish
  const isPasswordValid = await user.matchPassword(currentPassword);
  if (!isPasswordValid) {
    res.status(400);
    throw new Error('Joriy parol noto\'g\'ri');
  }

  // Yangi parolni o\'rnatish
  user.password = newPassword;
  await user.save();

  res.json({
    message: 'Parol muvaffaqiyatli o\'zgartirildi'
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
  }
  
  // Hozircha email yuborishni o'chirib qo'yamiz
  // Keyinchalik email konfiguratsiyasi qo'shilganda qayta yoqamiz
  res.json({ message: 'Parolni tiklash funksiyasi hozircha mavjud emas' });
});

export const verifyResetCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const pending = pendingPasswordResets.get(email.toLowerCase());
  if (!pending || pending.code !== code) {
    return res.status(400).json({ message: 'Invalid or expired code.' });
  }
  res.json({ verified: true });
});

// Send password reset code
export const sendPasswordResetCode = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email talab qilinadi');
  }

  // Email formati tekshirish
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Noto\'g\'ri email formati');
  }

  // Foydalanuvchi mavjudligini tekshirish
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(404);
    throw new Error('Bu email bilan foydalanuvchi topilmadi');
  }

  // Rate limiting - 1 daqiqada 1 marta kod yuborish
  const existingReset = pendingPasswordResets.get(email.toLowerCase());
  if (existingReset && Date.now() - existingReset.lastSent < 60000) {
    res.status(429);
    throw new Error('Kod yuborish uchun 1 daqiqa kutish kerak');
  }

  // 6 xonali tasdiqlash kodi yaratish
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Kodi xotiraga saqlash (10 daqiqa muddat)
  pendingPasswordResets.set(email.toLowerCase(), {
    code: resetCode,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 daqiqa
    attempts: 0,
    lastSent: Date.now()
  });

  // Email yuborish
  try {
    const emailTemplate = getEmailTemplate('passwordReset', resetCode, req.body.language || 'uz');
    await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      fromName: 'Everest Restaurant',
      html: emailTemplate.html
    });

    // Console ga ham kodni chiqaramiz (debug uchun)
    console.log(`🔑 Password reset code for ${email}: ${resetCode}`);

    res.status(200).json({ 
      message: 'Parol tiklash kodi yuborildi',
      email: email 
    });
  } catch (error) {
    // Email yuborishda xatolik bo'lsa, kodni o'chirish
    pendingPasswordResets.delete(email.toLowerCase());
    res.status(500);
    throw new Error('Parol tiklash kodi yuborishda xatolik yuz berdi');
  }
});

// Verify password reset code
export const verifyPasswordResetCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    res.status(400);
    throw new Error('Email va kod talab qilinadi');
  }

  const resetData = pendingPasswordResets.get(email.toLowerCase());
  
  if (!resetData) {
    res.status(400);
    throw new Error('Parol tiklash kodi topilmadi yoki muddati tugagan');
  }

  // Urinishlar sonini tekshirish
  if (resetData.attempts >= 3) {
    pendingPasswordResets.delete(email.toLowerCase());
    res.status(400);
    throw new Error('Juda ko\'p noto\'g\'ri urinish. Yangi kod so\'rang');
  }

  // Muddati tugaganini tekshirish
  if (Date.now() > resetData.expiresAt) {
    pendingPasswordResets.delete(email.toLowerCase());
    res.status(400);
    throw new Error('Parol tiklash kodi muddati tugagan');
  }

  // Kodni tekshirish
  if (resetData.code !== code) {
    resetData.attempts += 1;
    pendingPasswordResets.set(email.toLowerCase(), resetData);
    res.status(400);
    throw new Error('Noto\'g\'ri parol tiklash kodi');
  }

  // Kod to'g'ri bo'lsa, uni o'chirish va yangi parol o'rnatish uchun ruxsat berish
  pendingPasswordResets.delete(email.toLowerCase());

  res.status(200).json({
    message: 'Kod tasdiqlandi. Yangi parol o\'rnating.',
    email: email.toLowerCase(),
    canResetPassword: true
  });
});

// Reset password with new password
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    res.status(400);
    throw new Error('Email va yangi parol talab qilinadi');
  }

  // Kuchli parol siyosati
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    res.status(400);
    throw new Error('Parol kamida 8 ta belgidan iborat bo\'lishi, katta harf, kichik harf, raqam va maxsus belgi bo\'lishi kerak');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(404);
    throw new Error('Foydalanuvchi topilmadi');
  }

  // Yangi parolni o'rnatish
  user.password = newPassword;
  await user.save();

  // Avtomatik login uchun token yaratish
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.status(200).json({
    message: 'Parol muvaffaqiyatli o\'zgartirildi',
    email: email.toLowerCase(),
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.role === 'admin'
    },
    token
  });
});

// Google OAuth Authentication
export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email']
});

export const googleAuthCallback = asyncHandler(async (req, res) => {
  passport.authenticate('google', { session: false }, async (err, user) => {
    if (err) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
    }

    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
    }

    // Create JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/google/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  })(req, res);
});

// Configure Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists
    let user = await User.findOne({ email: profile.emails[0].value });

    if (user) {
      // Update user's Google ID if not set
      if (!user.googleId) {
        user.googleId = profile.id;
        await user.save();
      }
      return done(null, user);
    }

    // Create new user
    user = await User.create({
      name: profile.displayName,
      email: profile.emails[0].value,
      googleId: profile.id,
      isEmailVerified: true, // Google users are pre-verified
      role: 'user',
      createdAt: new Date()
    });

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));
