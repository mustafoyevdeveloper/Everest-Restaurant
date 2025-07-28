import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  category: {
    type: String,
    required: true,
    enum: ['breakfast', 'lunch', 'dinner', 'dessert', 'drink']
  },
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

const Menu = mongoose.model('Menu', menuSchema);
export default Menu;
