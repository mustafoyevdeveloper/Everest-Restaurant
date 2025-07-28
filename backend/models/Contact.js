import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['new', 'read', 'replied', 'closed'], 
    default: 'new' 
  },
  // Admin javobi uchun
  adminReply: {
    message: { type: String },
    repliedAt: { type: Date },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  // Foydalanuvchiga bildirishnomalar uchun
  notifications: [{
    type: { 
      type: String, 
      enum: ['read', 'replied'], 
      required: true 
    },
    message: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    sent: { type: Boolean, default: false }
  }],
  // Foydalanuvchi ID (agar tizimga kirgan bo'lsa)
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

contactSchema.plugin(mongoosePaginate);

const Contact = mongoose.model('Contact', contactSchema);
export default Contact; 