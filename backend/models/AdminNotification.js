import mongoose from 'mongoose';

const adminNotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['order_cancelled', 'reservation_cancelled', 'new_order', 'new_reservation', 'payment_received', 'contact_message'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  relatedReservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation'
  },
  relatedPayment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  relatedContact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  }
}, {
  timestamps: true
});

// Index for better query performance
adminNotificationSchema.index({ adminId: 1, read: 1, createdAt: -1 });
adminNotificationSchema.index({ type: 1, createdAt: -1 });

// Static method to create notification
adminNotificationSchema.statics.createNotification = async function(notificationData) {
  try {
    const notification = new this(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating admin notification:', error);
    throw error;
  }
};

// Static method to mark notifications as read
adminNotificationSchema.statics.markAsRead = async function(notificationIds, adminId) {
  try {
    const result = await this.updateMany(
      { _id: { $in: notificationIds }, adminId },
      { read: true }
    );
    return result;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
};

// Static method to get unread count
adminNotificationSchema.statics.getUnreadCount = async function(adminId) {
  try {
    const count = await this.countDocuments({ adminId, read: false });
    return count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

// Static method to get notifications with pagination
adminNotificationSchema.statics.getNotifications = async function(adminId, page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;
    const notifications = await this.find({ adminId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('relatedOrder', 'orderItems totalPrice status')
      .populate('relatedReservation', 'date time guests status')
      .populate('relatedPayment', 'amount status')
      .populate('relatedContact', 'name email message');
    
    const total = await this.countDocuments({ adminId });
    
    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

// Static method to create order cancellation notification
adminNotificationSchema.statics.createOrderCancellationNotification = async function(orderId, userId, adminId) {
  try {
    const formattedId = orderId.slice(-6).toUpperCase();
    const notification = await this.createNotification({
      type: 'order_cancelled',
      title: 'Buyurtma bekor qilindi',
      message: `Buyurtma #${formattedId} mijoz tomonidan bekor qilindi`,
      data: { orderId, userId },
      adminId,
      relatedOrder: orderId
    });
    return notification;
  } catch (error) {
    console.error('Error creating order cancellation notification:', error);
    throw error;
  }
};

// Static method to create reservation cancellation notification
adminNotificationSchema.statics.createReservationCancellationNotification = async function(reservationId, userId, adminId) {
  try {
    const formattedId = reservationId.slice(-6).toUpperCase();
    const notification = await this.createNotification({
      type: 'reservation_cancelled',
      title: 'Rezervatsiya bekor qilindi',
      message: `Rezervatsiya #${formattedId} mijoz tomonidan bekor qilindi`,
      data: { reservationId, userId },
      adminId,
      relatedReservation: reservationId
    });
    return notification;
  } catch (error) {
    console.error('Error creating reservation cancellation notification:', error);
    throw error;
  }
};

// Static method to create new order notification
adminNotificationSchema.statics.createNewOrderNotification = async function(orderId, adminId) {
  try {
    const formattedId = orderId.slice(-6).toUpperCase();
    const notification = await this.createNotification({
      type: 'new_order',
      title: 'Yangi buyurtma',
      message: `Yangi buyurtma #${formattedId} qabul qilindi`,
      data: { orderId },
      adminId,
      relatedOrder: orderId
    });
    return notification;
  } catch (error) {
    console.error('Error creating new order notification:', error);
    throw error;
  }
};

// Static method to create new reservation notification
adminNotificationSchema.statics.createNewReservationNotification = async function(reservationId, adminId) {
  try {
    const formattedId = reservationId.slice(-6).toUpperCase();
    const notification = await this.createNotification({
      type: 'new_reservation',
      title: 'Yangi rezervatsiya',
      message: `Yangi rezervatsiya #${formattedId} qabul qilindi`,
      data: { reservationId },
      adminId,
      relatedReservation: reservationId
    });
    return notification;
  } catch (error) {
    console.error('Error creating new reservation notification:', error);
    throw error;
  }
};

// Static method to create payment received notification
adminNotificationSchema.statics.createPaymentReceivedNotification = async function(paymentId, amount, adminId) {
  try {
    const notification = await this.createNotification({
      type: 'payment_received',
      title: 'To\'lov qabul qilindi',
      message: `${amount.toLocaleString()} UZS to'lov qabul qilindi`,
      data: { paymentId, amount },
      adminId,
      relatedPayment: paymentId
    });
    return notification;
  } catch (error) {
    console.error('Error creating payment received notification:', error);
    throw error;
  }
};

// Static method to create detailed payment notification with card info
adminNotificationSchema.statics.createDetailedPaymentNotification = async function(payment, adminId) {
  try {
    const cardInfo = payment.cardInfo ? 
      `Karta: ${payment.cardInfo.cardBrand || 'Unknown'} ****${payment.cardInfo.cardNumber || '****'}` : 
      'Karta ma\'lumotlari mavjud emas';
    
    const transactionInfo = payment.transactionDetails?.paycomId ? 
      `Transaction ID: ${payment.transactionDetails.paycomId}` : 
      `Transaction ID: ${payment.transactionId}`;
    
    const notification = await this.createNotification({
      type: 'payment_received',
      title: 'To\'lov muvaffaqiyatli bajarildi',
      message: `${payment.amount.toLocaleString()} UZS to'lov qabul qilindi. ${cardInfo}. ${transactionInfo}`,
      data: { 
        paymentId: payment._id, 
        amount: payment.amount,
        cardInfo: payment.cardInfo,
        transactionDetails: payment.transactionDetails,
        paymentMethod: payment.paymentMethod,
        orderId: payment.orderId,
        completedAt: payment.completedAt
      },
      adminId,
      relatedPayment: payment._id
    });
    return notification;
  } catch (error) {
    console.error('Error creating detailed payment notification:', error);
    throw error;
  }
};

// Static method to create contact message notification
adminNotificationSchema.statics.createContactMessageNotification = async function(contactId, name, adminId) {
  try {
    const notification = await this.createNotification({
      type: 'contact_message',
      title: 'Yangi xabar',
      message: `${name} dan yangi xabar`,
      data: { contactId, name },
      adminId,
      relatedContact: contactId
    });
    return notification;
  } catch (error) {
    console.error('Error creating contact message notification:', error);
    throw error;
  }
};

const AdminNotification = mongoose.model('AdminNotification', adminNotificationSchema);

export default AdminNotification; 