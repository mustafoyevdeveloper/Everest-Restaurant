import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  reservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'UZS'
  },
  paymentMethod: {
    type: String,
    enum: ['Payme'],
    default: 'Payme',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Cancelled'],
    default: 'Pending'
  },
  paymentUrl: {
    type: String,
    required: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  transactionId: {
    type: String
  },
  description: {
    type: String,
    required: true
  },
  
  // Payme specific fields
  paymeData: {
    merchantId: String,
    account: String,
    amount: Number, // Amount in tiyin
    signature: String,
    callbackUrl: String,
    returnUrl: String,
    failureUrl: String
  },
  
  // Card information (from Payme callback)
  cardInfo: {
    cardNumber: String, // Last 4 digits only for security
    cardType: String, // visa, mastercard, etc.
    cardBrand: String, // Payme, UzCard, etc.
    maskedNumber: String // **** **** **** 1234
  },
  
  // Transaction details
  transactionDetails: {
    paycomId: String, // Payme transaction ID
    paycomTime: Date, // When payment was processed
    createTime: Date, // When payment was created
    performTime: Date, // When payment was performed
    cancelTime: Date, // When payment was cancelled
    cancelReason: String, // Reason for cancellation
    receivers: [{
      id: String,
      amount: Number
    }]
  },
  
  // Payment metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceInfo: String,
    location: String,
    timezone: String
  },
  
  // Status history
  statusHistory: [{
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    reason: String,
    note: String
  }],
  
  completedAt: {
    type: Date
  },
  adminNotified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Virtual for payment type
paymentSchema.virtual('type').get(function() {
  if (this.order) return 'order';
  if (this.reservation) return 'reservation';
  return 'unknown';
});

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

// Virtual for payment duration
paymentSchema.virtual('paymentDuration').get(function() {
  if (this.completedAt && this.createdAt) {
    return Math.round((this.completedAt - this.createdAt) / 1000); // seconds
  }
  return null;
});

// Pre-save middleware to track status changes
paymentSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      reason: 'Status updated',
      note: `Payment status changed to ${this.status}`
    });
  }
  next();
});

// Index for efficient queries
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ adminNotified: 1 });
paymentSchema.index({ orderId: 1 }, { unique: true });
paymentSchema.index({ user: 1 });
paymentSchema.index({ 'transactionDetails.paycomId': 1 });
paymentSchema.index({ 'cardInfo.cardType': 1 });

// Add pagination plugin
paymentSchema.plugin(paginate);

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment; 