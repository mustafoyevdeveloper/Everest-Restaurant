import asyncHandler from '../utils/asyncHandler.js';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import Reservation from '../models/Reservation.js';
import AdminNotification from '../models/AdminNotification.js';
import PaymentNotificationService from '../utils/paymentNotification.js';
import paymeService from '../utils/payme.js';
import { emitToAll } from '../utils/socketEmitter.js';
import crypto from 'crypto';

// Create payment for order
export const createOrderPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  
  if (!orderId) {
    res.status(400);
    throw new Error('Order ID is required');
  }

  const order = await Order.findById(orderId).populate('user');
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to pay for this order');
  }

  if (order.isPaid) {
    res.status(400);
    throw new Error('Order is already paid');
  }

  try {
    const paymentData = paymeService.createOrderPayment(order);
    
    // Create payment record with metadata
    const payment = new Payment({
      user: req.user._id,
      order: orderId,
      amount: paymentData.amount,
      currency: 'UZS',
      paymentMethod: 'Payme',
      status: 'Pending',
      paymentUrl: paymentData.paymentUrl,
      orderId: paymentData.orderId,
      description: paymentData.description,
      
      // Payme data
      paymeData: {
        merchantId: paymeService.merchantId,
        account: paymentData.orderId,
        amount: Math.round(paymentData.amount * 100), // in tiyin
        signature: paymentData.signature,
        callbackUrl: `${process.env.FRONTEND_URL}/api/payments/webhook/payme`,
        returnUrl: `${process.env.FRONTEND_URL}/payment/success?orderId=${paymentData.orderId}`,
        failureUrl: `${process.env.FRONTEND_URL}/payment/failure?orderId=${paymentData.orderId}`
      },
      
      // Metadata
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        deviceInfo: req.get('User-Agent')?.includes('Mobile') ? 'Mobile' : 'Desktop',
        location: req.get('CF-IPCountry') || 'Unknown',
        timezone: req.get('X-Timezone') || 'Asia/Tashkent'
      },
      
      statusHistory: [{
        status: 'Pending',
        changedAt: new Date(),
        reason: 'Payment created',
        note: 'Payment link generated'
      }]
    });

    await payment.save();

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        paymentUrl: paymentData.paymentUrl,
        amount: paymentData.amount,
        orderId: paymentData.orderId
      }
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500);
    throw new Error('Failed to create payment');
  }
});

// Create payment for reservation
export const createReservationPayment = asyncHandler(async (req, res) => {
  // console.log('🔍 createReservationPayment called with body:', req.body);
  // console.log('👤 User:', req.user);
  // console.log('🔍 Request headers:', req.headers);
  
  const { reservationId } = req.body;
  
  if (!reservationId) {
    console.error('❌ Reservation ID is missing');
    res.status(400);
    throw new Error('Reservation ID is required');
  }

  // console.log('🔍 Looking for reservation with ID:', reservationId);
  
  try {
    const reservation = await Reservation.findById(reservationId);
    // console.log('🔍 Reservation query result:', reservation);
    
    if (!reservation) {
      console.error('❌ Reservation not found with ID:', reservationId);
      res.status(404);
      throw new Error('Reservation not found');
    }

    // console.log('✅ Reservation found:', {
    //   _id: reservation._id,
    //   name: reservation.name,
    //   totalPrice: reservation.totalPrice,
    //   pricePerGuest: reservation.pricePerGuest,
    //   guests: reservation.guests,
    //   user: reservation.user
    // });

    if (reservation.user && reservation.user.toString() !== req.user._id.toString()) {
      console.error('❌ User not authorized for this reservation');
      res.status(403);
      throw new Error('Not authorized to pay for this reservation');
    }

    if (reservation.isPaid) {
      console.error('❌ Reservation is already paid');
      res.status(400);
      throw new Error('Reservation is already paid');
    }

    // console.log('🔍 Creating payment data with paymeService...');
    const paymentData = paymeService.createReservationPayment(reservation);
    // console.log('✅ Payment data created:', paymentData);
    
    // Create payment record with metadata
    const payment = new Payment({
      user: req.user._id,
      reservation: reservationId,
      amount: paymentData.amount,
      currency: 'UZS',
      paymentMethod: 'Payme',
      status: 'Pending',
      paymentUrl: paymentData.paymentUrl,
      orderId: paymentData.orderId,
      description: paymentData.description,
      
      // Payme data
      paymeData: {
        merchantId: paymeService.merchantId,
        account: paymentData.orderId,
        amount: Math.round(paymentData.amount * 100), // in tiyin
        signature: paymentData.signature,
        callbackUrl: `${process.env.FRONTEND_URL}/api/payments/webhook/payme`,
        returnUrl: `${process.env.FRONTEND_URL}/payment/success?orderId=${paymentData.orderId}`,
        failureUrl: `${process.env.FRONTEND_URL}/payment/failure?orderId=${paymentData.orderId}`
      },
      
      // Metadata
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        deviceInfo: req.get('User-Agent')?.includes('Mobile') ? 'Mobile' : 'Desktop',
        location: req.get('CF-IPCountry') || 'Unknown',
        timezone: req.get('X-Timezone') || 'Asia/Tashkent'
      },
      
      statusHistory: [{
        status: 'Pending',
        changedAt: new Date(),
        reason: 'Payment created',
        note: 'Payment link generated'
      }]
    });

    // console.log('💾 Saving payment to database...');
    await payment.save();
    // console.log('✅ Payment saved successfully');

    const response = {
      success: true,
      data: {
        paymentId: payment._id,
        paymentUrl: paymentData.paymentUrl,
        amount: paymentData.amount,
        orderId: paymentData.orderId
      }
    };
    
    // console.log('📤 Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Payment creation error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500);
    throw new Error('Failed to create payment');
  }
});

// Payme webhook handler
export const handlePaymeWebhook = asyncHandler(async (req, res) => {
  try {
    const callbackData = req.body;
    
    // console.log('Payme webhook received:', callbackData);
    
    // Verify the webhook
    const result = paymeService.handlePaymentCallback(callbackData);
    
    if (!result.success) {
      res.status(400).json({ error: 'Payment failed' });
      return;
    }

    const { orderId, amount, transactionId } = result;
    
    // Find and update payment record
    const payment = await Payment.findOne({ orderId });
    
    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    // Extract card information from Payme callback
    const cardInfo = {
      cardNumber: callbackData.card?.number?.slice(-4) || null,
      cardType: callbackData.card?.type || null,
      cardBrand: callbackData.card?.brand || null,
      maskedNumber: callbackData.card?.masked_number || null
    };

    // Update payment with all Payme data
    payment.status = 'Completed';
    payment.transactionId = transactionId;
    payment.amount = amount; // Use the amount from result
    payment.completedAt = new Date();
    
    // Update transaction details
    payment.transactionDetails = {
      paycomId: callbackData.paycom_id || transactionId,
      paycomTime: callbackData.paycom_time ? new Date(callbackData.paycom_time * 1000) : new Date(),
      createTime: callbackData.create_time ? new Date(callbackData.create_time * 1000) : new Date(),
      performTime: callbackData.perform_time ? new Date(callbackData.perform_time * 1000) : new Date(),
      cancelTime: callbackData.cancel_time ? new Date(callbackData.cancel_time * 1000) : null,
      cancelReason: callbackData.cancel_reason || null,
      receivers: callbackData.receivers || []
    };
    
    // Update card information
    if (cardInfo.cardNumber) {
      payment.cardInfo = cardInfo;
    }
    
    // Add status history
    payment.statusHistory.push({
      status: 'Completed',
      changedAt: new Date(),
      reason: 'Payment successful',
      note: `Payment completed via Payme. Transaction ID: ${transactionId}`
    });

    await payment.save();

    // Update order or reservation
    if (payment.order) {
      const order = await Order.findById(payment.order);
      if (order) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentResult = {
          id: transactionId,
          status: 'COMPLETED',
          update_time: new Date().toISOString(),
          email_address: order.shippingAddress.email
        };
        await order.save();
      }
    }

    if (payment.reservation) {
      const reservation = await Reservation.findById(payment.reservation);
      if (reservation) {
        reservation.isPaid = true;
        reservation.paidAt = new Date();
        await reservation.save();
      }
    }

    // Create admin notification with detailed payment info
    await createDetailedPaymentNotification(payment);

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get payment status
export const getPaymentStatus = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  
  const payment = await Payment.findById(paymentId);
  
  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }

  if (payment.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this payment');
  }

  res.json({
    success: true,
    data: {
      status: payment.status,
      amount: payment.amount,
      paymentUrl: payment.paymentUrl,
      completedAt: payment.completedAt,
      cardInfo: payment.cardInfo,
      transactionDetails: payment.transactionDetails
    }
  });
});

// Get user payments
export const getUserPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
    populate: ['order', 'reservation']
  };

  const payments = await Payment.paginate({ user: req.user._id }, options);
  
  res.json({
    success: true,
    data: payments
  });
});

// Get all payments (admin)
export const getAllPayments = asyncHandler(async (req, res) => {
  // console.log('🔍 getAllPayments called with query:', req.query);
  
  const { page = 1, limit = 20, status, paymentMethod, type } = req.query;
  
  const query = {};
  if (status && status !== 'all') query.status = status;
  if (paymentMethod && paymentMethod !== 'all') query.paymentMethod = paymentMethod;
  if (type && type !== 'all') query.type = type;

  // console.log('🔍 Query filter:', query);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
    populate: ['user', 'order', 'reservation']
  };

  // console.log('🔍 Pagination options:', options);

  const payments = await Payment.paginate(query, options);
  
  // console.log('🔍 Payments found:', payments.docs?.length || 0);
  // console.log('🔍 Total payments:', payments.totalDocs || 0);
  // console.log('🔍 Payment statuses:', [...new Set(payments.docs?.map(p => p.status) || [])]);
  
  res.json({
    success: true,
    data: payments
  });
});

// Get payment statistics (admin)
export const getPaymentStats = asyncHandler(async (req, res) => {
  const stats = await PaymentNotificationService.getPaymentStats();
  res.json({
    success: true,
    data: stats
  });
});

// Get recent payments (admin)
export const getRecentPayments = asyncHandler(async (req, res) => {
  try {
    const recent = await PaymentNotificationService.getAdminNotifications(10, 1);
    res.json({
      success: true,
      data: recent.payments || []
    });
  } catch (error) {
    console.error('Error fetching recent payments:', error);
    res.json({
      success: true,
      data: []
    });
  }
});

// Create detailed payment notification
export const createDetailedPaymentNotification = asyncHandler(async (payment) => {
  try {
    // Get all admin users
    const User = (await import('../models/User.js')).default;
    const adminUsers = await User.find({ isAdmin: true });
    
    // Create notifications for all admins with detailed payment info
    for (const admin of adminUsers) {
      await AdminNotification.createDetailedPaymentNotification(payment, admin._id);
    }

    // Emit socket event for real-time notification
    emitToAll('payment_received', {
      paymentId: payment._id,
      amount: payment.amount,
      userId: payment.user,
      cardInfo: payment.cardInfo,
      transactionId: payment.transactionId,
      timestamp: new Date()
    });
  } catch (notificationError) {
    console.error('Failed to create detailed payment notification:', notificationError);
  }
});

// Create payment received notification (legacy)
export const createPaymentNotification = asyncHandler(async (paymentId, amount, userId) => {
  try {
    // Get all admin users
    const User = (await import('../models/User.js')).default;
    const adminUsers = await User.find({ isAdmin: true });
    
    // Create notifications for all admins
    for (const admin of adminUsers) {
      await AdminNotification.createPaymentReceivedNotification(paymentId, amount, admin._id);
    }

    // Emit socket event for real-time notification
    emitToAll('payment_received', {
      paymentId,
      amount,
      userId,
      timestamp: new Date()
    });
  } catch (notificationError) {
    console.error('Failed to create payment notification:', notificationError);
  }
}); 

// Test card payment for order (without Payme)
export const createTestOrderCardPayment = asyncHandler(async (req, res) => {
  const { orderId, cardData } = req.body;
  
  if (!orderId || !cardData) {
    res.status(400);
    throw new Error('Order ID and card data are required');
  }

  // Validate card data
  if (!cardData.cardNumber || !cardData.expiryDate || !cardData.cvv || !cardData.cardholderName) {
    res.status(400);
    throw new Error('All card fields are required');
  }

  // Check if orderId is a valid MongoDB ObjectId
  const mongoose = await import('mongoose');
  let order;
  
  if (mongoose.Types.ObjectId.isValid(orderId)) {
    // If it's a valid ObjectId, try to find the order
    order = await Order.findById(orderId).populate('user');
  } else {
    // If it's not a valid ObjectId, it might be a temporary order ID
    // In this case, we should create a new order or handle it differently
    res.status(400);
    throw new Error('Invalid order ID format. Please complete the order first.');
  }
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to pay for this order');
  }

  if (order.isPaid) {
    res.status(400);
    throw new Error('Order is already paid');
  }

  try {
    // Simulate card payment processing
    const paymentId = crypto.randomBytes(16).toString('hex');
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create payment record
    const payment = new Payment({
      user: req.user._id,
      order: orderId,
      amount: order.totalPrice,
      currency: 'UZS',
      paymentMethod: 'Card',
      status: 'Completed',
      orderId: paymentId,
      description: `Card payment for order ${orderId}`,
      
      // Card payment data
      cardData: {
        cardNumber: cardData.cardNumber.slice(-4), // Store only last 4 digits
        cardType: getCardType(cardData.cardNumber),
        maskedNumber: `**** **** **** ${cardData.cardNumber.slice(-4)}`,
        expiryDate: cardData.expiryDate,
        cardholderName: cardData.cardholderName
      },
      
      // Transaction data
      transactionData: {
        transactionId,
        gateway: 'Card Gateway',
        responseCode: '00',
        responseMessage: 'Approved',
        authorizationCode: `AUTH_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        processedAt: new Date()
      },
      
      // Metadata
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        deviceInfo: req.get('User-Agent')?.includes('Mobile') ? 'Mobile' : 'Desktop',
        location: req.get('CF-IPCountry') || 'Unknown',
        timezone: req.get('X-Timezone') || 'Asia/Tashkent'
      },
      
      statusHistory: [{
        status: 'Completed',
        changedAt: new Date(),
        reason: 'Card payment successful',
        note: 'Payment processed successfully'
      }]
    });

    await payment.save();

    // Update order status
    order.isPaid = true;
    order.paymentStatus = 'Paid';
    order.status = 'Confirmed';
    await order.save();

    // Create admin notification
    const notification = new AdminNotification({
      type: 'payment',
      title: 'New Card Payment',
      message: `Card payment of ${order.totalPrice.toLocaleString()} UZS received for order #${orderId.slice(-6)}`,
      data: {
        orderId: order._id,
        paymentId: payment._id,
        amount: order.totalPrice,
        paymentMethod: 'Card'
      }
    });
    await notification.save();

    // Emit to admin
    emitToAll('admin_notification', {
      type: 'payment',
      title: 'New Card Payment',
      message: `Card payment of ${order.totalPrice.toLocaleString()} UZS received for order #${orderId.slice(-6)}`,
      data: {
        orderId: order._id,
        paymentId: payment._id,
        amount: order.totalPrice,
        paymentMethod: 'Card'
      }
    });

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        transactionId,
        amount: order.totalPrice,
        orderId: orderId
      }
    });
  } catch (error) {
    console.error('Card payment error:', error);
    res.status(500);
    throw new Error('Failed to process card payment');
  }
});

// Card payment for reservation
export const createReservationCardPayment = asyncHandler(async (req, res) => {
  const { reservationId, cardData } = req.body;
  
  if (!reservationId || !cardData) {
    res.status(400);
    throw new Error('Reservation ID and card data are required');
  }

  // Validate card data
  if (!cardData.cardNumber || !cardData.expiryDate || !cardData.cvv || !cardData.cardholderName) {
    res.status(400);
    throw new Error('All card fields are required');
  }

  const reservation = await Reservation.findById(reservationId).populate('user');
  
  if (!reservation) {
    res.status(404);
    throw new Error('Reservation not found');
  }

  if (reservation.user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to pay for this reservation');
  }

  if (reservation.isPaid) {
    res.status(400);
    throw new Error('Reservation is already paid');
  }

  try {
    // Simulate card payment processing
    const paymentId = crypto.randomBytes(16).toString('hex');
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create payment record
    const payment = new Payment({
      user: req.user._id,
      reservation: reservationId,
      amount: reservation.totalPrice,
      currency: 'UZS',
      paymentMethod: 'Card',
      status: 'Completed',
      orderId: paymentId,
      description: `Card payment for reservation ${reservationId}`,
      
      // Card payment data
      cardData: {
        cardNumber: cardData.cardNumber.slice(-4), // Store only last 4 digits
        cardType: getCardType(cardData.cardNumber),
        maskedNumber: `**** **** **** ${cardData.cardNumber.slice(-4)}`,
        expiryDate: cardData.expiryDate,
        cardholderName: cardData.cardholderName
      },
      
      // Transaction data
      transactionData: {
        transactionId,
        gateway: 'Card Gateway',
        responseCode: '00',
        responseMessage: 'Approved',
        authorizationCode: `AUTH_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        processedAt: new Date()
      },
      
      // Metadata
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        deviceInfo: req.get('User-Agent')?.includes('Mobile') ? 'Mobile' : 'Desktop',
        location: req.get('CF-IPCountry') || 'Unknown',
        timezone: req.get('X-Timezone') || 'Asia/Tashkent'
      },
      
      statusHistory: [{
        status: 'Completed',
        changedAt: new Date(),
        reason: 'Card payment successful',
        note: 'Payment processed successfully'
      }]
    });

    await payment.save();

    // Update reservation status
    reservation.isPaid = true;
    reservation.paymentStatus = 'Paid';
    reservation.status = 'Confirmed';
    await reservation.save();

    // Create admin notification
    const notification = new AdminNotification({
      type: 'payment',
      title: 'New Card Payment',
      message: `Card payment of ${reservation.totalPrice.toLocaleString()} UZS received for reservation #${reservationId.slice(-6)}`,
      data: {
        reservationId: reservation._id,
        paymentId: payment._id,
        amount: reservation.totalPrice,
        paymentMethod: 'Card'
      }
    });
    await notification.save();

    // Emit to admin
    emitToAll('admin_notification', {
      type: 'payment',
      title: 'New Card Payment',
      message: `Card payment of ${reservation.totalPrice.toLocaleString()} UZS received for reservation #${reservationId.slice(-6)}`,
      data: {
        reservationId: reservation._id,
        paymentId: payment._id,
        amount: reservation.totalPrice,
        paymentMethod: 'Card'
      }
    });

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        transactionId,
        amount: reservation.totalPrice,
        reservationId: reservationId
      }
    });
  } catch (error) {
    console.error('Card payment error:', error);
    res.status(500);
    throw new Error('Failed to process card payment');
  }
});

// Test card payment for order (without Payme)
export const createTestOrderCardPayment = asyncHandler(async (req, res) => {
  const { orderId, cardData } = req.body;
  
  if (!orderId || !cardData) {
    res.status(400);
    throw new Error('Order ID and card data are required');
  }

  // Validate card data
  if (!cardData.cardNumber || !cardData.expiryDate || !cardData.cvv || !cardData.cardholderName) {
    res.status(400);
    throw new Error('All card fields are required');
  }

  // Check if orderId is a valid MongoDB ObjectId
  const mongoose = await import('mongoose');
  let order;
  
  if (mongoose.Types.ObjectId.isValid(orderId)) {
    order = await Order.findById(orderId).populate('user');
  } else {
    res.status(400);
    throw new Error('Invalid order ID format. Please complete the order first.');
  }
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to pay for this order');
  }

  if (order.isPaid) {
    res.status(400);
    throw new Error('Order is already paid');
  }

  try {
    // Simulate test card payment processing (no Payme)
    const paymentId = crypto.randomBytes(16).toString('hex');
    const transactionId = `TEST_TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create payment record
    const payment = new Payment({
      user: req.user._id,
      order: orderId,
      amount: order.totalPrice,
      currency: 'UZS',
      paymentMethod: 'Test Card',
      status: 'Completed',
      orderId: paymentId,
      description: `Test card payment for order ${orderId}`,
      
      // Card payment data
      cardData: {
        cardNumber: cardData.cardNumber.slice(-4),
        cardType: getCardType(cardData.cardNumber),
        maskedNumber: `**** **** **** ${cardData.cardNumber.slice(-4)}`,
        expiryDate: cardData.expiryDate,
        cardholderName: cardData.cardholderName
      },
      
      // Transaction data
      transactionData: {
        transactionId,
        gateway: 'Test Gateway',
        responseCode: '00',
        responseMessage: 'Test Approved',
        authorizationCode: `TEST_AUTH_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        processedAt: new Date()
      },
      
      // Metadata
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        deviceInfo: req.get('User-Agent')?.includes('Mobile') ? 'Mobile' : 'Desktop',
        location: req.get('CF-IPCountry') || 'Unknown',
        timezone: req.get('X-Timezone') || 'Asia/Tashkent',
        isTestPayment: true
      },
      
      statusHistory: [{
        status: 'Completed',
        changedAt: new Date(),
        reason: 'Test card payment successful',
        note: 'Test payment processed successfully'
      }]
    });

    await payment.save();

    // Update order status
    order.isPaid = true;
    order.paymentStatus = 'Paid';
    order.status = 'Confirmed';
    await order.save();

    // Create admin notification
    const notification = new AdminNotification({
      type: 'payment',
      title: 'New Test Card Payment',
      message: `Test card payment of ${order.totalPrice.toLocaleString()} UZS received for order #${orderId.slice(-6)}`,
      data: {
        orderId: order._id,
        paymentId: payment._id,
        amount: order.totalPrice,
        paymentMethod: 'Test Card',
        isTestPayment: true
      }
    });
    await notification.save();

    // Emit to admin
    emitToAll('admin_notification', {
      type: 'payment',
      title: 'New Test Card Payment',
      message: `Test card payment of ${order.totalPrice.toLocaleString()} UZS received for order #${orderId.slice(-6)}`,
      data: {
        orderId: order._id,
        paymentId: payment._id,
        amount: order.totalPrice,
        paymentMethod: 'Test Card',
        isTestPayment: true
      }
    });

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        transactionId,
        amount: order.totalPrice,
        orderId: orderId,
        isTestPayment: true
      }
    });
  } catch (error) {
    console.error('Test card payment error:', error);
    res.status(500);
    throw new Error('Failed to process test card payment');
  }
});

// Helper function to determine card type
function getCardType(cardNumber) {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  
  if (/^4/.test(cleanNumber)) return 'Visa';
  if (/^5[1-5]/.test(cleanNumber)) return 'Mastercard';
  if (/^3[47]/.test(cleanNumber)) return 'American Express';
  if (/^6/.test(cleanNumber)) return 'Discover';
  if (/^2/.test(cleanNumber)) return 'Mastercard';
  
  return 'Unknown';
} 