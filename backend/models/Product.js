import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const productSchema = new mongoose.Schema({
  // Asosiy ma'lumotlar
  name_uz: { type: String, required: false, trim: true },
  name_ru: { type: String, required: false, trim: true },
  name_en: { type: String, required: false, trim: true },
  description_uz: { type: String, required: false },
  description_ru: { type: String, required: false },
  description_en: { type: String, required: false },
  nameKey: {
    type: String,
    required: false,
    trim: true,
  },
  descriptionKey: {
    type: String,
    required: false,
  },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  
  // Kategoriya
  category: { 
    type: String, 
    default: 'appetizers',
    enum: [
      'appetizers',
      'main_courses', 
      'desserts',
      'beverages',
      'pizza',
      'pasta',
      'salads',
      'seafood',
      'steaks',
      'soups',
      'grilled',
      'vegan',
      'sushi',
      'sandwiches',
      'breakfast',
      'kids',
      'specials',
      'cocktails',
      'smoothies'
    ]
  },
  
  // To'liq tavsif
  fullDescription: {
    type: String,
    required: false,
    default: ''
  },
  
  // Mahsulot turlari
  types: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: false }
  }],
  
  // Ingredientlar
  ingredients: [{
    name: { type: String, required: true },
    description: { type: String, required: false }
  }],
  
  // Tayyorlash usuli
  preparationMethod: {
    type: String,
    required: false,
    default: ''
  },
  
  // Xizmat ko'rsatish vaqti (minutlarda)
  preparationTime: {
    type: Number,
    required: false,
    default: 15
  },
  
  // Kaloriya
  calories: {
    type: Number,
    required: false
  },
  
  // Allergenlar
  allergens: [{
    type: String,
    enum: [
      'gluten',
      'dairy',
      'nuts',
      'eggs',
      'soy',
      'fish',
      'shellfish',
      'wheat',
      'peanuts',
      'tree_nuts'
    ]
  }],
  
  // Maxsus belgilar
  tags: [{
    type: String,
    enum: [
      'spicy',
      'vegetarian',
      'vegan',
      'gluten_free',
      'dairy_free',
      'organic',
      'local',
      'seasonal',
      'chef_special',
      'popular',
      'new'
    ]
  }],
  
  // Qo'shimcha rasmlar
  additionalImages: [{ type: String }],
  
  // Narx tarixi
  priceHistory: [{
    price: { type: Number, required: true },
    date: { type: Date, default: Date.now }
  }],
  
  // Reyting va miqdori
  rating: { type: Number, default: 4.5 },
  ratingCount: { type: Number, default: 0 },
  quantity: { type: Number, min: 0, required: false },
  isAvailable: { type: Boolean, default: true },
  
  // SEO uchun
  metaTitle: { type: String, required: false },
  metaDescription: { type: String, required: false },
  
  // Statistika
  viewCount: { type: Number, default: 0 },
  orderCount: { type: Number, default: 0 },
  
  // Admin ma'lumotlari
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual maydonlar
productSchema.virtual('averageRating').get(function() {
  return this.ratingCount > 0 ? (this.rating / this.ratingCount).toFixed(1) : 0;
});

productSchema.virtual('isPopular').get(function() {
  return this.orderCount > 10 || this.rating > 4.5;
});

productSchema.virtual('isNew').get(function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.createdAt > thirtyDaysAgo;
});

productSchema.plugin(mongoosePaginate);

const Product = mongoose.model('Product', productSchema);
export default Product; 