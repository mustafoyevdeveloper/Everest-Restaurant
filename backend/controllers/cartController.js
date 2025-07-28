import Cart from '../models/Cart.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/cart
export const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
  res.json({ items: cart.items });
});

// POST /api/cart
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

  const itemIndex = cart.items.findIndex(i => i.product.toString() === productId);
  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity });
  }
  await cart.save();
  
  // Return updated cart with populated items
  const updatedCart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  res.json({ items: updatedCart.items });
});

// DELETE /api/cart/:itemId
export const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ message: 'Cart not found' });
  cart.items = cart.items.filter(i => i._id.toString() !== req.params.itemId);
  await cart.save();
  
  // Return updated cart with populated items
  const updatedCart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  res.json({ items: updatedCart.items });
});

// DELETE /api/cart/clear
export const clearCart = asyncHandler(async (req, res) => {
  await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });
  res.status(204).send();
}); 