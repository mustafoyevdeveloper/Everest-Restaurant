import Favorite from '../models/Favorite.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/favorites
export const getFavorites = asyncHandler(async (req, res) => {
  let favorite = await Favorite.findOne({ user: req.user._id }).populate('items');
  if (!favorite) favorite = await Favorite.create({ user: req.user._id, items: [] });
  res.json({ items: favorite.items });
});

// POST /api/favorites
export const addFavorite = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  let favorite = await Favorite.findOne({ user: req.user._id });
  if (!favorite) favorite = await Favorite.create({ user: req.user._id, items: [] });
  
  // Check if product already exists in favorites
  if (!favorite.items.includes(productId)) {
    favorite.items.push(productId);
    await favorite.save();
  }
  
  // Return updated favorites with populated items
  const updatedFavorite = await Favorite.findOne({ user: req.user._id }).populate('items');
  res.json({ items: updatedFavorite.items });
});

// DELETE /api/favorites/:itemId
export const removeFavorite = asyncHandler(async (req, res) => {
  const favorite = await Favorite.findOne({ user: req.user._id });
  if (!favorite) return res.status(404).json({ message: 'Favorites not found' });
  favorite.items = favorite.items.filter(i => i.toString() !== req.params.itemId);
  await favorite.save();
  
  // Return updated favorites with populated items
  const updatedFavorite = await Favorite.findOne({ user: req.user._id }).populate('items');
  res.json({ items: updatedFavorite.items });
});

export const removeFromFavorites = asyncHandler(async (req, res) => {
  const favorite = await Favorite.findOne({ user: req.user._id });
  if (!favorite) return res.status(404).json({ message: 'Favorites not found' });
  favorite.items = favorite.items.filter(i => i.toString() !== req.params.productId);
  await favorite.save();
  
  // Return updated favorites with populated items
  const updatedFavorite = await Favorite.findOne({ user: req.user._id }).populate('items');
  res.json({ items: updatedFavorite.items });
}); 