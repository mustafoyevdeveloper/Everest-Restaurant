import Order from '../models/Order.js';
import Reservation from '../models/Reservation.js';
import Payment from '../models/Payment.js';
import Contact from '../models/Contact.js';
import Product from '../models/Product.js';
import AdminSeen from '../models/AdminSeen.js';
import AdminNotification from '../models/AdminNotification.js';
import asyncHandler from '../utils/asyncHandler.js';

// Get dashboard statistics
export const getDashboardStats = asyncHandler(async (req, res) => {
  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Get this month's date range
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  // Get orders stats
  const totalOrders = await Order.countDocuments();
  const todayOrders = await Order.countDocuments({
    createdAt: { $gte: today }
  });
  const thisMonthOrders = await Order.countDocuments({
    createdAt: { $gte: thisMonth, $lt: nextMonth }
  });
  const pendingOrders = await Order.countDocuments({ status: 'Pending' });
  const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
  const cancelledOrders = await Order.countDocuments({ status: 'Cancelled' });

  // Get reservations stats
  const totalReservations = await Reservation.countDocuments();
  const todayReservations = await Reservation.countDocuments({
    date: { $gte: today }
  });
  const confirmedReservations = await Reservation.countDocuments({ status: 'Confirmed' });
  const cancelledReservations = await Reservation.countDocuments({ status: 'Cancelled' });

  // Get users stats
  const User = (await import('../models/User.js')).default;
  const totalUsers = await User.countDocuments();
  const newUsers = await User.countDocuments({
    createdAt: { $gte: today }
  });

  // Get messages stats
  const totalMessages = await Contact.countDocuments();
  const unreadMessages = await Contact.countDocuments({ read: false });

  // Calculate total revenue
  const totalRevenue = await Order.aggregate([
    { $match: { status: { $in: ['Delivered', 'Completed'] } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ]);

  const todayRevenue = await Order.aggregate([
    { 
      $match: { 
        status: { $in: ['Delivered', 'Completed'] },
        createdAt: { $gte: today }
      } 
    },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ]);

  const thisMonthRevenue = await Order.aggregate([
    { 
      $match: { 
        status: { $in: ['Delivered', 'Completed'] },
        createdAt: { $gte: thisMonth, $lt: nextMonth }
      } 
    },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ]);

  // Get recent orders
  const recentOrders = await Order.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  // Get recent cancellations
  const recentCancellations = await Promise.all([
    // Get cancelled orders
    Order.find({ status: 'Cancelled' })
      .populate('user', 'name email')
      .sort({ updatedAt: -1 })
      .limit(5)
      .then(orders => orders.map(order => ({ ...order.toObject(), type: 'order' }))),
    
    // Get cancelled reservations
    Reservation.find({ status: 'Cancelled' })
      .populate('user', 'name email')
      .sort({ updatedAt: -1 })
      .limit(5)
      .then(reservations => reservations.map(reservation => ({ ...reservation.toObject(), type: 'reservation' })))
  ]).then(results => {
    const allCancellations = [...results[0], ...results[1]];
    return allCancellations
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 5);
  });

  // Get notification stats
  const notificationStats = await AdminNotification.aggregate([
    { $match: { adminId: req.user._id } },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);

  const notificationCounts = notificationStats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});

  res.json({
    totalOrders,
    todayOrders,
    thisMonthOrders,
    totalRevenue: totalRevenue[0]?.total || 0,
    todayRevenue: todayRevenue[0]?.total || 0,
    thisMonthRevenue: thisMonthRevenue[0]?.total || 0,
    pendingOrders,
    deliveredOrders,
    cancelledOrders,
    totalReservations,
    todayReservations,
    confirmedReservations,
    cancelledReservations,
    totalUsers,
    newUsers,
    unreadMessages,
    recentOrders,
    recentCancellations,
    notificationCounts
  });
});

// Get notifications count for admin panel (only unseen items)
export const getNotifications = asyncHandler(async (req, res) => {
  // Get admin seen times
  const adminSeen = await AdminSeen.getOrCreate();

  // Get new orders (pending status) created after last seen
  const newOrders = await Order.countDocuments({ 
    status: 'Pending',
    createdAt: { $gt: adminSeen.orders }
  });

  // Get new reservations (pending status) created after last seen
  const newReservations = await Reservation.countDocuments({ 
    status: 'Pending',
    createdAt: { $gt: adminSeen.reservations }
  });

  // Get new payments (pending status) created after last seen
  const newPayments = await Payment.countDocuments({ 
    status: 'Pending',
    createdAt: { $gt: adminSeen.payments }
  });

  // Get unread messages created after last seen
  const newMessages = await Contact.countDocuments({ 
    read: false,
    createdAt: { $gt: adminSeen.messages }
  });

  // Get new products created after last seen
  const newProducts = await Product.countDocuments({
    createdAt: { $gt: adminSeen.products }
  });

  // Calculate total notifications
  const totalNotifications = newOrders + newReservations + newPayments + newMessages + newProducts;

  res.json({
    total: totalNotifications,
    orders: newOrders,
    reservations: newReservations,
    payments: newPayments,
    messages: newMessages,
    products: newProducts
  });
});

// Mark section as seen
export const markSectionAsSeen = asyncHandler(async (req, res) => {
  const { section } = req.body;
  
  if (!section) {
    return res.status(400).json({ message: 'Section is required' });
  }

  const validSections = ['orders', 'reservations', 'payments', 'messages', 'products'];
  if (!validSections.includes(section)) {
    return res.status(400).json({ message: 'Invalid section' });
  }

  // Get or create admin seen document
  const adminSeen = await AdminSeen.getOrCreate();
  
  // Update the specific section's seen time
  adminSeen[section] = new Date();
  await adminSeen.save();

  res.json({ 
    message: `${section} marked as seen`,
    seenAt: adminSeen[section]
  });
}); 