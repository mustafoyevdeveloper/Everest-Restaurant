import mongoose from 'mongoose';

const adminSeenSchema = new mongoose.Schema({
  orders: {
    type: Date,
    default: Date.now
  },
  reservations: {
    type: Date,
    default: Date.now
  },
  payments: {
    type: Date,
    default: Date.now
  },
  messages: {
    type: Date,
    default: Date.now
  },
  products: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure only one document exists
adminSeenSchema.statics.getOrCreate = async function() {
  let adminSeen = await this.findOne();
  if (!adminSeen) {
    adminSeen = new this();
    await adminSeen.save();
  }
  return adminSeen;
};

const AdminSeen = mongoose.model('AdminSeen', adminSeenSchema);

export default AdminSeen; 