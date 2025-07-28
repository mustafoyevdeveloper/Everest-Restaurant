import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import paginate from 'mongoose-paginate-v2';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  phone: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Faqat virtual property sifatida!
userSchema.virtual('isAdmin').get(function() {
  return this.role === 'admin';
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Add pagination plugin
userSchema.plugin(paginate);

const User = mongoose.model('User', userSchema);
export default User;
