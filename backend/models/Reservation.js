import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const reservationSchema = new mongoose.Schema({
  reservationCode: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // Allow non-logged-in users
  },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  guests: { type: Number, required: true, min: 1 },
  notes: { type: String },
  status: {
    type: String,
    required: true,
    enum: [
      'Pending',     // Kutilmoqda
      'Confirmed',   // Tasdiqlangan
      'Seated',      // O'tirgan
      'Completed',   // Bajarilgan
      'NoShow',      // Kelmay qoldi
      'Cancelled'    // Bekor qilindi
    ],
    default: 'Pending',
  },
  pricePerGuest: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Payme', 'Card'],
    default: 'Payme'
  },
  paymentResult: {
    id: { type: String },
    status: { type: String },
    update_time: { type: String },
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false,
  },
  paidAt: {
    type: Date,
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
  timestamps: true 
});

// Pre-save middleware to track status changes
reservationSchema.pre('save', function(next) {
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

// Add pagination plugin
reservationSchema.plugin(paginate);

const Reservation = mongoose.model('Reservation', reservationSchema);
export default Reservation; 