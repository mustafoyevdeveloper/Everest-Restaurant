import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const orderSchema = new mongoose.Schema({
  orderCode: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  orderItems: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      image: { type: String, required: true },
      price: { type: Number, required: true },
      product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product',
      },
    },
  ],
  shippingAddress: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    district: { type: String, required: true },
    region: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  orderType: {
    type: String,
    required: true,
    enum: ['delivery', 'pickup'],
    default: 'delivery'
  },
  pickupDetails: {
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      required: function() { return this.orderType === 'pickup'; }
    },
    tableNumber: { type: String },
    pickupTime: { type: Date },
    specialInstructions: { type: String }
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Payme'],
    default: 'Payme'
  },
  paymentResult: {
    id: { type: String },
    status: { type: String },
    update_time: { type: String },
    email_address: { type: String },
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false,
  },
  paidAt: {
    type: Date,
  },
  isDelivered: {
    type: Boolean,
    required: true,
    default: false,
  },
  deliveredAt: {
    type: Date,
  },
  status: {
    type: String,
    required: true,
    default: 'Pending',
    enum: [
      'Pending',        // Kutilmoqda
      'Confirmed',      // Tasdiqlangan
      'Preparing',      // Tayyorlanmoqda
      'Ready',          // Tayyor
      'OutForDelivery', // Yetkazib berilmoqda
      'Delivered',      // Yetkazildi
      'Cancelled'       // Bekor qilindi
    ]
  },
  statusHistory: [{
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: String, default: 'System' }, // 'System', 'Admin', 'User'
    note: { type: String }
  }],
  cancellationReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
});

// Pre-save middleware to track status changes
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: 'System',
      note: `Status changed to ${this.status}`
    });
  }
  next();
});

orderSchema.plugin(mongoosePaginate);

const Order = mongoose.model('Order', orderSchema);
export default Order; 