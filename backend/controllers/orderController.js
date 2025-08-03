// backend/controllers/orderController.js
import Order from '../models/Order.js';
import AdminNotification from '../models/AdminNotification.js';
import asyncHandler from '../utils/asyncHandler.js';
import sendEmail from '../utils/sendEmail.js';
import { emitToAll } from '../utils/socketEmitter.js';

function generateOrderCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create new order
export const createOrder = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    orderType = 'delivery',
    pickupDetails
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  // Validate order type
  if (!['delivery', 'pickup'].includes(orderType)) {
    res.status(400);
    throw new Error('Invalid order type. Must be "delivery" or "pickup"');
  }

  // Validate pickup details if order type is pickup
  if (orderType === 'pickup' && (!pickupDetails || !pickupDetails.reservationId)) {
    res.status(400);
    throw new Error('Reservation ID is required for pickup orders');
  }

  const fullShippingAddress = orderType === 'delivery' ? {
    ...shippingAddress,
    fullName: req.user.name,
    email: req.user.email,
  } : {
    fullName: req.user.name,
    email: req.user.email,
    district: 'Restaurant',
    region: 'Tashkent',
    postalCode: '100000',
    country: 'Uzbekistan'
  };

  // Generate unique order code
  let orderCode;
  let isUnique = false;
  while (!isUnique) {
    orderCode = generateOrderCode();
    const exists = await Order.findOne({ orderCode });
    if (!exists) isUnique = true;
  }

  const order = new Order({
    orderCode,
    user: req.user._id,
    orderItems: orderItems.map(item => ({
      ...item,
      name: item.name || item.nameKey || 'Mahsulot',
      product: item._id,
      _id: undefined
    })),
    shippingAddress: fullShippingAddress,
    orderType,
    pickupDetails: orderType === 'pickup' ? pickupDetails : undefined,
    paymentMethod: 'Payme',
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    isPaid: true, // Simulate successful payment
    paidAt: Date.now(), // Simulate successful payment
    paymentResult: { // Simulate payment result
      id: `txn_${new Date().getTime()}`,
      status: 'COMPLETED',
      update_time: new Date().toISOString(),
      email_address: req.user.email,
    },
    status: 'Pending', // Start with pending status
    statusHistory: [{
      status: 'Pending',
      changedAt: new Date(),
      changedBy: 'System',
      note: `Order created - ${orderType === 'delivery' ? 'Delivery' : 'Pickup'}`
    }]
  });

  const createdOrder = await order.save();

  // Create admin notification for new order
  try {
    // Get all admin users
    const User = (await import('../models/User.js')).default;
    const adminUsers = await User.find({ isAdmin: true });
    
    // Create notifications for all admins
    for (const admin of adminUsers) {
      await AdminNotification.createNewOrderNotification(createdOrder._id, admin._id);
    }

    // Emit socket event for real-time notification
    emitToAll('new_order', {
      orderId: createdOrder._id,
      orderCode: createdOrder.orderCode,
      user: req.user.name,
      totalPrice: createdOrder.totalPrice,
      orderType: createdOrder.orderType,
      reservationCode: createdOrder.pickupDetails?.reservationCode,
      timestamp: new Date()
    });
  } catch (notificationError) {
    console.error('Failed to create order notification:', notificationError);
  }

  // Send email notification to admin
  try {
    const emailHtml = `
      <h1>New Order Received! #${createdOrder.orderCode}</h1>
      <p>A new order has been placed on Everest Restaurant at ${new Date(createdOrder.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}.</p>
      <p><strong>Order Type:</strong> ${createdOrder.orderType === 'delivery' ? 'Delivery' : 'Pickup at Restaurant'}</p>
      ${createdOrder.orderType === 'pickup' && createdOrder.pickupDetails?.reservationCode ? `<p><strong>Reservation ID:</strong> ${createdOrder.pickupDetails.reservationCode}</p>` : ''}
      <h2>Customer Details:</h2>
      <p><strong>Name:</strong> ${createdOrder.shippingAddress.fullName}</p>
      <p><strong>Email:</strong> ${createdOrder.shippingAddress.email}</p>
      
      ${createdOrder.orderType === 'delivery' ? `
      <h2>Shipping Address:</h2>
      <p>
        ${createdOrder.shippingAddress.district}, ${createdOrder.shippingAddress.region},<br>
        ${createdOrder.shippingAddress.postalCode}, ${createdOrder.shippingAddress.country}
      </p>
      ` : ''}

      <h2>Order Items:</h2>
      <ul>
        ${createdOrder.orderItems.map(item => `
          <li>
            ${item.quantity} x ${item.name || item.nameKey} - 
            <strong>${(item.price * item.quantity).toLocaleString()} so'm</strong>
          </li>`).join('')}
      </ul>

      <h2>Order Totals:</h2>
      <p><strong>Items Price:</strong> ${createdOrder.itemsPrice.toLocaleString()} so'm</p>
      <p><strong>Shipping Price:</strong> ${createdOrder.shippingPrice.toLocaleString()} so'm</p>
      <p><strong>Tax Price:</strong> ${createdOrder.taxPrice.toLocaleString()} so'm</p>
      <p><strong>Total Price:</strong> ${createdOrder.totalPrice.toLocaleString()} so'm</p>
      
      <p>This order has been automatically marked as paid via Payme.</p>
    `;

    await sendEmail({
      to: 'mustafoyev7788@gmail.com', // Admin's email
      subject: `New Order Received - #${createdOrder.orderCode}`,
      html: emailHtml,
      fromName: 'Everest Restaurant Orders'
    });
    // eslint-disable-next-line no-console
    // console.log('✅ Order notification email sent successfully.');
  } catch (emailError) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to send order notification email:', emailError);
    // Do not block the response to the user if email fails
  }

  // eslint-disable-next-line no-console
  // console.log('📦 Order created:', createdOrder);
  res.status(201).json(createdOrder);
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  // Only allow cancellation if order is still pending or confirmed
  if (!['Pending', 'Confirmed'].includes(order.status)) {
    res.status(400);
    throw new Error('Order cannot be cancelled at this stage');
  }

  order.status = 'Cancelled';
  order.cancellationReason = reason || 'Cancelled by user';
  order.statusHistory.push({
    status: 'Cancelled',
    changedAt: new Date(),
    changedBy: 'User',
    note: reason || 'Cancelled by user'
  });

  const updatedOrder = await order.save();

  // Create admin notification for order cancellation
  try {
    // Get all admin users
    const User = (await import('../models/User.js')).default;
    const adminUsers = await User.find({ isAdmin: true });
    
    // Create notifications for all admins
    for (const admin of adminUsers) {
      await AdminNotification.createOrderCancellationNotification(
        order._id, 
        req.user._id, 
        admin._id
      );
    }

    // Emit socket event for real-time notification
    emitToAll('order_cancelled', {
      orderId: order._id,
      userId: req.user._id,
      userName: req.user.name,
      reason: reason,
      timestamp: new Date()
    });
  } catch (notificationError) {
    console.error('Failed to create order cancellation notification:', notificationError);
  }

  res.json(updatedOrder);
});

// Get all orders (admin)
export const getAllOrders = asyncHandler(async (req, res) => {
  // console.log('🔍 getAllOrders called with query:', req.query);
  
  const { page = 1, limit = 20, status, paymentStatus } = req.query;
  
  const query = {};
  if (status && status !== 'all') query.status = status;
  if (paymentStatus && paymentStatus !== 'all') query.isPaid = paymentStatus === 'paid';

  // console.log('🔍 Query filter:', query);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
    populate: 'user'
  };

  // console.log('🔍 Pagination options:', options);

  const orders = await Order.paginate(query, options);
  
  // console.log('🔍 Orders found:', orders.docs?.length || 0);
  // console.log('🔍 Total orders:', orders.totalDocs || 0);
  
  res.json({
    success: true,
    data: orders
  });
});

// Get user's orders
export const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate({ path: 'orderItems.product', model: 'Product', select: 'name price image' })
    .sort({ createdAt: -1 });
  
  orders.forEach(order => {
    if (order.orderItems) {
      order.orderItems = order.orderItems.filter(item => item.product);
    }
  });

  res.json(orders);
});

// Get single order
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate({ path: 'orderItems.product', model: 'Product' });
    
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user is admin or the owner of the order
  if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }
  
  if (order.orderItems) {
    order.orderItems = order.orderItems.filter(item => item.product);
  }
  
  res.json(order);
});

// Update order status (admin only)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error('Not authorized as an admin.');
  }

  const { status, note } = req.body;
  const orderId = req.params.id;

  if (!status) {
    res.status(400);
    throw new Error('Status is required');
  }

  const order = await Order.findById(orderId);
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Update status and add to history
  order.status = status;
  order.statusHistory.push({
    status: status,
    changedAt: new Date(),
    changedBy: 'Admin',
    note: note || `Status updated to ${status}`
  });

  // Update delivery status if delivered
  if (status === 'Delivered') {
    order.isDelivered = true;
    order.deliveredAt = new Date();
  }

  const updatedOrder = await order.save();

  // Emit real-time update
  emitToAll('order_status_updated', {
    orderId: order._id,
    status: status,
    timestamp: new Date()
  });

  res.json({
    success: true,
    data: updatedOrder
  });
});

// Delete order (admin only) - Only for cancelled orders
export const deleteOrder = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error('Not authorized as an admin.');
  }

  const order = await Order.findById(req.params.id);
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Only allow deletion of cancelled orders
  if (order.status !== 'Cancelled') {
    res.status(400);
    throw new Error('Only cancelled orders can be deleted');
  }

  await Order.findByIdAndDelete(req.params.id);
  
  res.json({
    success: true,
    message: 'Order deleted successfully'
  });
});

// Get order statistics (admin only)
export const getOrderStats = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  
  const totalRevenueResult = await Order.aggregate([
    { $match: { status: 'Delivered' } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ]);

  const totalRevenue = totalRevenueResult[0]?.total || 0;

  res.json({
    totalOrders,
    totalRevenue
  });
});

// Get dashboard statistics (admin only)
export const getDashboardStats = asyncHandler(async (req, res) => {
  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get this month's date range
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  // Total orders
  const totalOrders = await Order.countDocuments();
  
  // Today's orders
  const todayOrders = await Order.countDocuments({
    createdAt: { $gte: today, $lt: tomorrow }
  });

  // This month's orders
  const thisMonthOrders = await Order.countDocuments({
    createdAt: { $gte: thisMonth, $lt: nextMonth }
  });

  // Total revenue
  const totalRevenueResult = await Order.aggregate([
    { $match: { status: { $in: ['Delivered', 'Completed'] } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ]);
  const totalRevenue = totalRevenueResult[0]?.total || 0;

  // Today's revenue
  const todayRevenueResult = await Order.aggregate([
    { 
      $match: { 
        createdAt: { $gte: today, $lt: tomorrow },
        status: { $in: ['Delivered', 'Completed'] }
      } 
    },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ]);
  const todayRevenue = todayRevenueResult[0]?.total || 0;

  // This month's revenue
  const thisMonthRevenueResult = await Order.aggregate([
    { 
      $match: { 
        createdAt: { $gte: thisMonth, $lt: nextMonth },
        status: { $in: ['Delivered', 'Completed'] }
      } 
    },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ]);
  const thisMonthRevenue = thisMonthRevenueResult[0]?.total || 0;

  // Orders by status
  const pendingOrders = await Order.countDocuments({ status: 'Pending' });
  const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
  const cancelledOrders = await Order.countDocuments({ status: 'Cancelled' });

  // Recent orders (last 5)
  const recentOrders = await Order.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    totalOrders,
    todayOrders,
    thisMonthOrders,
    totalRevenue,
    todayRevenue,
    thisMonthRevenue,
    pendingOrders,
    deliveredOrders,
    cancelledOrders,
    recentOrders
  });
});

// Get order by ID
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  res.json({
    success: true,
    data: order
  });
});
