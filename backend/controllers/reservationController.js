import Reservation from '../models/Reservation.js';
import AdminNotification from '../models/AdminNotification.js';
import asyncHandler from '../utils/asyncHandler.js';
import { errorHandler } from '../utils/errorHandler.js';
import sendEmail from '../utils/sendEmail.js';
import { emitToAll } from '../utils/socketEmitter.js';
import mongoose from 'mongoose';

const PRICE_PER_GUEST = 20000; // Har bir mehmon uchun narx

function generateReservationCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '#';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// @desc    Create a new reservation
// @route   POST /api/reservations
// @access  Public
export const createReservation = asyncHandler(async (req, res, next) => {
  const { 
    name, email, phone, date, time, guests, notes 
  } = req.body;

  // Get user ID if user is authenticated
  const userId = req.user ? req.user._id : null;

  console.log('🔍 createReservation called with:', {
    user: req.user ? { _id: req.user._id, name: req.user.name } : 'No user',
    userId: userId,
    body: req.body
  });

  if (!date || !time || !guests) {
    return next(new errorHandler('Please provide date, time, and number of guests', 400));
  }

  const calculatedTotalPrice = guests * PRICE_PER_GUEST;

  // Generate unique reservation code
  let reservationCode;
  let isUnique = false;
  while (!isUnique) {
    reservationCode = generateReservationCode();
    const exists = await Reservation.findOne({ reservationCode });
    if (!exists) isUnique = true;
  }

  const reservation = new Reservation({
    reservationCode,
    user: userId, // This will be null if no user, or user ID if authenticated
    name,
    email,
    phone,
    date,
    time,
    guests,
    notes,
    pricePerGuest: PRICE_PER_GUEST,
    totalPrice: calculatedTotalPrice,
    paymentMethod: req.body.paymentMethod || 'Payme',
    status: 'Pending',
    statusHistory: [{
      status: 'Pending',
      changedAt: new Date(),
      changedBy: 'System',
      note: 'Reservation created'
    }]
  });

  console.log('🔍 Reservation object before save:', {
    _id: reservation._id,
    user: reservation.user,
    name: reservation.name,
    email: reservation.email
  });

  const createdReservation = await reservation.save();

  console.log('✅ Reservation saved successfully:', {
    _id: createdReservation._id,
    user: createdReservation.user,
    name: createdReservation.name,
    email: createdReservation.email
  });

  if (createdReservation) {
    // Create admin notification for new reservation
    try {
      // Get all admin users
      const User = (await import('../models/User.js')).default;
      const adminUsers = await User.find({ isAdmin: true });
      
      // Create notifications for all admins
      for (const admin of adminUsers) {
        await AdminNotification.createNewReservationNotification(createdReservation._id, admin._id);
      }

      // Emit socket event for real-time notification
      emitToAll('new_reservation', {
        reservationId: createdReservation._id,
        reservationCode: createdReservation.reservationCode,
        name: createdReservation.name,
        date: createdReservation.date,
        time: createdReservation.time,
        guests: createdReservation.guests,
        timestamp: new Date()
      });
    } catch (notificationError) {
      console.error('Failed to create reservation notification:', notificationError);
    }

    try {
      const emailHtml = `
        <h1>New Reservation Request</h1>
        <p>A new reservation has been made and paid for at Everest Restaurant.</p>
        <h2>Reservation Details:</h2>
        <ul>
          <li><strong>Name:</strong> ${createdReservation.name}</li>
          <li><strong>Email:</strong> ${createdReservation.email}</li>
          <li><strong>Phone:</strong> ${createdReservation.phone}</li>
          <li><strong>Date:</strong> ${new Date(createdReservation.date).toLocaleDateString()}</li>
          <li><strong>Time:</strong> ${createdReservation.time}</li>
          <li><strong>Guests:</strong> ${createdReservation.guests}</li>
          ${createdReservation.notes ? `<li><strong>Notes:</strong> ${createdReservation.notes}</li>` : ''}
        </ul>
        <h2>Payment Details:</h2>
        <ul>
          <li><strong>Total Paid:</strong> ${createdReservation.totalPrice.toLocaleString()} so'm</li>
          <li><strong>Payment Status:</strong> Pending</li>
        </ul>
        <p>Please log in to the admin panel to confirm this reservation.</p>
      `;

      await sendEmail({
        to: 'mustafoyev7788@gmail.com',
        subject: `New Pending Reservation from ${createdReservation.name}`,
        html: emailHtml,
        fromName: 'Everest Restaurant Reservations',
        context: {
          name: createdReservation.name,
          date: new Date(createdReservation.date).toLocaleDateString(),
          time: createdReservation.time,
          guests: createdReservation.guests,
          totalPrice: createdReservation.totalPrice,
        },
      });
      // eslint-disable-next-line no-console
      // console.log('Reservation notification email sent successfully.');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to send reservation notification email:', error);
    }

    res.status(201).json(createdReservation);
  } else {
    res.status(400);
    throw new Error('Invalid reservation data');
  }
});

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Private/Admin
export const getAllReservations = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    res.status(403);
    throw new Error('Not authorized as an admin.');
  }
  
  const { page = 1, limit = 20, status } = req.query;
  
  const query = {};
  if (status && status !== 'all') {
    query.status = status;
  }
  
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
    populate: 'user',
  };

  const reservations = await Reservation.paginate(query, options);
  
  res.json({
    success: true,
    data: reservations
  });
});

// @desc    Update reservation status
// @route   PUT /api/reservations/:id
// @access  Private/Admin
export const updateReservationStatus = asyncHandler(async (req, res) => {
  // console.log('updateReservationStatus called with:', {
  //   params: req.params,
  //   body: req.body,
  //   user: req.user
  // });

  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error('Not authorized as an admin.');
  }

  const { status, note } = req.body;

  if (!status) {
    res.status(400);
    throw new Error('Status is required');
  }

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error('Invalid reservation ID format');
  }

  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    res.status(404);
    throw new Error('Reservation not found');
  }

  // console.log('Found reservation:', {
  //   id: reservation._id,
  //   currentStatus: reservation.status,
  //   newStatus: status
  // });

  // Update status and add to history
  reservation.status = status;
  reservation.statusHistory.push({
    status: status,
    changedAt: new Date(),
    changedBy: 'Admin',
    note: note || `Status updated to ${status}`
  });

  try {
    const updatedReservation = await reservation.save();
    
    // console.log('Reservation updated successfully:', {
    //   id: updatedReservation._id,
    //   newStatus: updatedReservation.status
    // });
    
    // Emit real-time update
    emitToAll('reservation_status_updated', {
      reservationId: reservation._id,
      status: status,
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      data: updatedReservation
    });
  } catch (saveError) {
    console.error('Save error:', saveError);
    res.status(500);
    throw new Error('Failed to save reservation: ' + saveError.message);
  }
});

// @desc    Get logged in user's reservations
// @route   GET /api/reservations/myreservations
// @access  Private
export const getMyReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(reservations);
});

// @desc    Cancel a reservation
// @route   PUT /api/reservations/:id/cancel
// @access  Private
export const cancelReservation = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    res.status(404);
    throw new Error('Reservation not found');
  }

  // Check if user owns this reservation or is admin
  if (reservation.user && reservation.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(401);
    throw new Error('Not authorized to cancel this reservation');
  }

  // Only allow cancellation if reservation is still pending or confirmed
  if (!['Pending', 'Confirmed'].includes(reservation.status)) {
    res.status(400);
    throw new Error('Reservation cannot be cancelled at this stage');
  }

  reservation.status = 'Cancelled';
  // Get language from request or default to English
  const language = req.body.language || req.headers['accept-language'] || 'en';
  
  // Define cancellation messages in different languages
  const cancellationMessages = {
    en: 'Cancelled by user',
    uz: 'Foydalanuvchi tomonidan bekor qilindi',
    ru: 'Отменено пользователем'
  };
  
  const cancellationMessage = cancellationMessages[language] || cancellationMessages.en;
  
  reservation.cancellationReason = reason || cancellationMessage;
  reservation.statusHistory.push({
    status: 'Cancelled',
    changedAt: new Date(),
    changedBy: req.user.isAdmin ? 'Admin' : 'User',
    note: reason || cancellationMessage
  });

  const updatedReservation = await reservation.save();

  // Create admin notification for reservation cancellation
  try {
    // Get all admin users
    const User = (await import('../models/User.js')).default;
    const adminUsers = await User.find({ isAdmin: true });
    
    // Create notifications for all admins
    for (const admin of adminUsers) {
      await AdminNotification.createReservationCancellationNotification(
        reservation._id, 
        req.user._id, 
        admin._id
      );
    }

    // Emit socket event for real-time notification
    emitToAll('reservation_cancelled', {
      reservationId: reservation._id,
      userId: req.user._id,
      userName: req.user.name,
      reason: reason,
      timestamp: new Date()
    });
  } catch (notificationError) {
    console.error('Failed to create reservation cancellation notification:', notificationError);
  }

  res.json(updatedReservation);
});

// @desc    Delete reservation (admin only) - Only for cancelled reservations
// @route   DELETE /api/reservations/:id
// @access  Private/Admin
export const deleteReservation = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error('Not authorized as an admin.');
  }

  const reservation = await Reservation.findById(req.params.id);
  
  if (!reservation) {
    res.status(404);
    throw new Error('Reservation not found');
  }

  // Only allow deletion of cancelled reservations
  if (reservation.status !== 'Cancelled') {
    res.status(400);
    throw new Error('Only cancelled reservations can be deleted');
  }

  await Reservation.findByIdAndDelete(req.params.id);
  
  res.json({
    success: true,
    message: 'Reservation deleted successfully'
  });
});

// @desc    Get reservation statistics
// @route   GET /api/reservations/stats
// @access  Private/Admin
export const getReservationStats = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error('Not authorized as an admin.');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const total = await Reservation.countDocuments();
  const todayCount = await Reservation.countDocuments({
    date: { $gte: today.toISOString().split('T')[0] }
  });
  const confirmed = await Reservation.countDocuments({ status: 'Confirmed' });
  const pending = await Reservation.countDocuments({ status: 'Pending' });
  const seated = await Reservation.countDocuments({ status: 'Seated' });
  const completed = await Reservation.countDocuments({ status: 'Completed' });
  const noShow = await Reservation.countDocuments({ status: 'NoShow' });
  const cancelled = await Reservation.countDocuments({ status: 'Cancelled' });

  res.json({
    total,
    today: todayCount,
    confirmed,
    pending,
    seated,
    completed,
    noShow,
    cancelled
  });
});
