import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import Reservation from '../models/Reservation.js';
import sendEmail from './sendEmail.js';
import AdminNotification from '../models/AdminNotification.js';
import { emitToAll } from './socketEmitter.js';

class PaymentNotificationService {
  // Save payment details when payment is initiated
  async savePaymentDetails(paymentData) {
    try {
      const payment = new Payment({
        user: paymentData.user,
        type: paymentData.type,
        referenceId: paymentData.referenceId,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        cardDetails: paymentData.cardDetails,
        transactionId: paymentData.transactionId,
        description: paymentData.description,
        status: 'pending'
      });

      await payment.save();
      return payment;
    } catch (error) {
      console.error('Error saving payment details:', error);
      throw error;
    }
  }

  // Update payment status when payment is completed
  async updatePaymentStatus(transactionId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        ...additionalData
      };

      if (status === 'completed') {
        updateData.paidAt = new Date();
        updateData.adminNotified = false; // Reset for new notification
      }

      const payment = await Payment.findOneAndUpdate(
        { transactionId },
        updateData,
        { new: true }
      ).populate('user', 'name email phone');

      if (payment && status === 'completed') {
        // Also update the related Order or Reservation
        if (payment.type === 'order') {
          await Order.findByIdAndUpdate(payment.referenceId, { 
            isPaid: true, 
            paidAt: new Date(),
            paymentMethod: payment.paymentMethod
          });
        } else if (payment.type === 'reservation') {
          await Reservation.findByIdAndUpdate(payment.referenceId, { 
            isPaid: true, 
            paidAt: new Date(),
            paymentMethod: payment.paymentMethod,
            status: 'Confirmed'
          });
        }
        
        // Send notification to admin
        await this.sendAdminNotification(payment);
      }

      return payment;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  // Send notification to admin
  async sendAdminNotification(payment) {
    try {
      // Mark as notified to prevent duplicate emails
      await Payment.findByIdAndUpdate(payment._id, { adminNotified: true });

      const emailSubject = `✅ New Payment Received: ${payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h1 style="color: #333;">New Payment Notification</h1>
          <p>A new payment has been successfully processed on Everest Restaurant.</p>
          <hr>
          <h2>Payment Details:</h2>
          <ul>
            <li><strong>Payment ID:</strong> ${payment._id}</li>
            <li><strong>Transaction ID:</strong> ${payment.transactionId}</li>
            <li><strong>Amount:</strong> <strong>${new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' }).format(payment.amount)}</strong></li>
            <li><strong>Payment Method:</strong> ${payment.paymentMethod}</li>
            <li><strong>Status:</strong> <span style="color: green; font-weight: bold;">${payment.status}</span></li>
            <li><strong>Date:</strong> ${new Date(payment.paidAt).toLocaleString()}</li>
          </ul>
          <h2>Customer Details:</h2>
          <ul>
            <li><strong>Name:</strong> ${payment.user?.name || 'N/A'}</li>
            <li><strong>Email:</strong> ${payment.user?.email || 'N/A'}</li>
            <li><strong>Phone:</strong> ${payment.user?.phone || 'N/A'}</li>
          </ul>
           <h2>Transaction For:</h2>
          <p>${payment.description}</p>
          <hr>
          <p>You can view the details in the admin panel.</p>
        </div>
      `;

      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'mustafoyev7788@gmail.com',
        subject: emailSubject,
        html: emailHtml,
        fromName: 'Everest Payments',
      });

      return true;
    } catch (error) {
      console.error('Error sending admin notification email:', error);
      // We don't re-throw the error to not interrupt the payment flow
      return false;
    }
  }

  // Get payment notifications for admin
  async getAdminNotifications(limit = 20, page = 1) {
    try {
      const skip = (page - 1) * limit;
      const payments = await Payment.find()
        .populate('user', 'name email phone')
        .populate('referenceId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Payment.countDocuments();
      return { payments, total, page, limit };
    } catch (error) {
      console.error('Error getting admin notifications:', error);
      throw error;
    }
  }

  // Get unread payment notifications count
  async getUnreadCount() {
    try {
      const count = await Payment.countDocuments({ status: 'pending' });
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Mark notifications as read
  async markAsRead(paymentIds) {
    try {
      await Payment.updateMany(
        { _id: { $in: paymentIds } },
        { status: 'read', updatedAt: new Date() }
      );
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  // Get payment statistics for admin
  async getPaymentStats() {
    try {
      const totalPayments = await Payment.countDocuments();
      const pendingPayments = await Payment.countDocuments({ status: 'pending' });
      const completedPayments = await Payment.countDocuments({ status: 'completed' });
      
      const totalAmountAgg = await Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const completedAmount = totalAmountAgg[0]?.total || 0;

      // Today's stats
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const todayStats = await Payment.aggregate([
        { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay }, status: 'completed' } },
        { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } }
      ]);
      
      const todayCount = todayStats[0]?.count || 0;
      const todayAmount = todayStats[0]?.amount || 0;

      return {
        overall: {
          totalPayments,
          totalAmount: completedAmount,
          completedPayments,
          completedAmount,
          pendingPayments
        },
        today: {
          count: todayCount,
          amount: todayAmount
        }
      };
    } catch (error) {
      console.error('Error getting payment stats:', error);
      throw error;
    }
  }

  // Helper method to get card type
  getCardType(number) {
    const cleanNumber = number.replace(/\s/g, '');
    if (cleanNumber.startsWith('4')) return 'visa';
    if (cleanNumber.startsWith('5')) return 'mastercard';
    if (cleanNumber.startsWith('34') || cleanNumber.startsWith('37')) return 'amex';
    return 'generic';
  }

  // Create payment notification
  async createPaymentNotification(paymentId, amount, userId) {
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
  }
}

export default new PaymentNotificationService(); 