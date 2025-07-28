import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';

// Helper function to get full image URL
const getFullImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // URL ni to'g'ridan-to'g'ri qaytaramiz
  return imagePath;
};

// GET /api/products (public)
export const getProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 100, category, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  
  const query = {};
  if (category) query.category = category;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort
  };

  const products = await Product.paginate(query, options);
  
  // Transform products to include full image URLs
  const transformedProducts = {
    ...products,
    docs: products.docs.map(product => ({
      ...product.toObject(),
      image: getFullImageUrl(product.image)
    }))
  };
  
  res.json({
    success: true,
    data: transformedProducts
  });
});

// GET /api/products/:id (public)
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  const productWithFullImage = {
    ...product.toObject(),
    image: getFullImageUrl(product.image),
    additionalImages: product.additionalImages?.map(img => getFullImageUrl(img)) || []
  };
  
  res.json(productWithFullImage);
});

// POST /api/products/:id/view (public) - View count oshirish
export const incrementViewCount = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $inc: { viewCount: 1 } },
    { new: true }
  );
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  res.json({ success: true, viewCount: product.viewCount });
});

// POST /api/products (admin only)
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name_uz, name_ru, name_en,
    description_uz, description_ru, description_en,
    price,
    image,
    category,
    rating,
    quantity,
    isAvailable,
    fullDescription,
    types,
    ingredients,
    preparationMethod,
    preparationTime,
    calories,
    allergens,
    tags,
    additionalImages,
    metaTitle,
    metaDescription
  } = req.body;

  // At least one language must be present
  if (!name_uz && !name_ru && !name_en) {
    res.status(400);
    throw new Error('At least one language name is required');
  }
  if (!description_uz && !description_ru && !description_en) {
    res.status(400);
    throw new Error('At least one language description is required');
  }

  // Agar mahsulot mavjud emas qilib yaratilsa, miqdorni 0 ga teng qilish
  let finalQuantity = quantity !== undefined ? quantity : undefined;
  let finalIsAvailable = isAvailable !== undefined ? isAvailable : true;
  
  if (finalIsAvailable === false) {
    finalQuantity = 0;
  }

  const productData = {
    name_uz, name_ru, name_en,
    description_uz, description_ru, description_en,
    price,
    image,
    category,
    rating,
    quantity: finalQuantity,
    isAvailable: finalIsAvailable,
    fullDescription,
    types,
    ingredients,
    preparationMethod,
    preparationTime,
    calories,
    allergens,
    tags,
    additionalImages,
    metaTitle,
    metaDescription,
    createdBy: req.user._id,
    lastModifiedBy: req.user._id
  };

  const product = await Product.create(productData);
  res.status(201).json(product);
});

// PUT /api/products/:id (admin only)
export const updateProduct = asyncHandler(async (req, res) => {
  const {
    name_uz, name_ru, name_en,
    description_uz, description_ru, description_en,
    price,
    image,
    category,
    rating,
    quantity,
    isAvailable,
    fullDescription,
    types,
    ingredients,
    preparationMethod,
    preparationTime,
    calories,
    allergens,
    tags,
    additionalImages,
    metaTitle,
    metaDescription
  } = req.body;

  // At least one language must be present
  if (!name_uz && !name_ru && !name_en) {
    res.status(400);
    throw new Error('At least one language name is required');
  }
  if (!description_uz && !description_ru && !description_en) {
    res.status(400);
    throw new Error('At least one language description is required');
  }

  const updateData = {
    name_uz, name_ru, name_en,
    description_uz, description_ru, description_en,
    price,
    image,
    category,
    rating,
    fullDescription,
    types,
    ingredients,
    preparationMethod,
    preparationTime,
    calories,
    allergens,
    tags,
    additionalImages,
    metaTitle,
    metaDescription,
    lastModifiedBy: req.user._id
  };

  // Agar mahsulot mavjud emas qilib qo'yilsa, miqdorni 0 ga teng qilish
  if (isAvailable !== undefined) {
    updateData.isAvailable = isAvailable;
    // Agar mavjud emas bo'lsa, miqdorni 0 ga teng qilish
    if (isAvailable === false) {
      updateData.quantity = 0;
    } else if (quantity !== undefined) {
      // Agar mavjud bo'lsa va miqdor kiritilgan bo'lsa, uni saqlash
      updateData.quantity = quantity;
    }
  } else if (quantity !== undefined) {
    // Agar faqat miqdor o'zgartirilayotgan bo'lsa
    updateData.quantity = quantity;
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  );

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json(product);
});

// DELETE /api/products/:id (admin only)
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  res.json({ message: 'Product deleted successfully' });
});

// GET /api/products/stats (admin only)
export const getProductStats = asyncHandler(async (req, res) => {
  const totalProducts = await Product.countDocuments();
  const productsByCategory = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);
  
  const popularProducts = await Product.find({ isPopular: true }).limit(5);
  const newProducts = await Product.find({ isNew: true }).limit(5);
  
  res.json({
    totalProducts,
    productsByCategory,
    popularProducts,
    newProducts
  });
});