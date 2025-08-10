import Order from '../models/Order.js';
import Reservation from '../models/Reservation.js';
import Payment from '../models/Payment.js';
import Contact from '../models/Contact.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import AdminSeen from '../models/AdminSeen.js';
import AdminNotification from '../models/AdminNotification.js';
import asyncHandler from '../utils/asyncHandler.js';

// Get dashboard statistics
export const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // Get total orders
    const totalOrders = await Order.countDocuments();
    
    // Get total revenue
    const revenueData = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;
    
    // Get today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRevenueData = await Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const todayRevenue = todayRevenueData.length > 0 ? todayRevenueData[0].total : 0;
    
    // Get this month's revenue
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const lastMonthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1, 1);
    const lastMonthEnd = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
    const monthRevenueData = await Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: thisMonth } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const monthRevenue = monthRevenueData.length > 0 ? monthRevenueData[0].total : 0;

    // Last month revenue
    const lastMonthRevenueAgg = await Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const lastMonthRevenue = lastMonthRevenueAgg.length > 0 ? lastMonthRevenueAgg[0].total : 0;
    
    // Get total users and new users today
    const totalUsers = await User.countDocuments({ role: 'user' });
    const newUsers = await User.countDocuments({ role: 'user', createdAt: { $gte: today } });
    
    // Get today's orders
    const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });
    
    // Get this month's orders
    const monthOrders = await Order.countDocuments({ createdAt: { $gte: thisMonth } });
    const lastMonthOrders = await Order.countDocuments({ createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd } });
    
    // Get total products
    const totalProducts = await Product.countDocuments();
    
    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email');
    
    // Get recent payments
    const recentPayments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get reservations stats
    const totalReservations = await Reservation.countDocuments();
    const todayReservations = await Reservation.countDocuments({ createdAt: { $gte: today } });
    const monthReservations = await Reservation.countDocuments({ createdAt: { $gte: thisMonth } });
    const lastMonthReservations = await Reservation.countDocuments({ createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd } });
    const confirmedReservations = await Reservation.countDocuments({ status: 'Confirmed' });
    const cancelledReservations = await Reservation.countDocuments({ status: 'Cancelled' });

    // Get recent reservations
    const recentReservations = await Reservation.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // Get order status counts
    const orderStatusCounts = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get reservation status counts
    const reservationStatusCounts = await Reservation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object format
    const orderStatuses = {};
    orderStatusCounts.forEach(item => {
      orderStatuses[item._id] = item.count;
    });

    const reservationStatuses = {};
    reservationStatusCounts.forEach(item => {
      reservationStatuses[item._id] = item.count;
    });

    // Unread messages count
    const unreadMessages = await Contact.countDocuments({ read: false });

    // Month-over-month comparisons (percent)
    const calcMoM = (current, prev) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    };
    const ordersMoM = calcMoM(monthOrders, lastMonthOrders);
    const revenueMoM = calcMoM(monthRevenue, lastMonthRevenue);
    const reservationsMoM = calcMoM(monthReservations, lastMonthReservations);

    res.json({
      success: true,
      data: {
        totalOrders,
        todayOrders,
        monthOrders,
        totalRevenue,
        todayRevenue,
        monthRevenue,
        totalUsers,
        newUsers,
        unreadMessages,
        totalReservations,
        todayReservations,
        monthReservations,
        lastMonthReservations,
        confirmedReservations,
        cancelledReservations,
        totalProducts,
        recentOrders,
        recentPayments,
        recentReservations,
        orderStatuses,
        reservationStatuses,
        monthOrders,
        lastMonthOrders,
        monthRevenue,
        lastMonthRevenue,
        ordersMoM,
        revenueMoM,
        reservationsMoM
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Dashboard ma\'lumotlarini olishda xatolik',
      error: error.message
    });
  }
});

// Get notifications count for admin panel (only unseen items)
export const getNotifications = asyncHandler(async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirishnomalarni olishda xatolik',
      error: error.message
    });
  }
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