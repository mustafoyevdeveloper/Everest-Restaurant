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
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;
    
    // Get total users
    const totalUsers = await User.countDocuments({ role: 'user' });
    
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
    
    // Get recent reservations
    const recentReservations = await Reservation.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        totalUsers,
        totalProducts,
        recentOrders,
        recentPayments,
        recentReservations
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