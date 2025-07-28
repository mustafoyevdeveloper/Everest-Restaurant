export interface ProductType {
  name: string;
  price: number;
  description?: string;
}

export interface Ingredient {
  name: string;
  description?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  image: string; // Backend response field
  stock: number;
  isFeatured: boolean;
  nameKey?: string;
  descriptionKey?: string;
  rating: {
    rate: number;
    count: number;
  };
  rating: number; // Backend response field
  quantity: number; // New field for product quantity
  isAvailable: boolean; // New field for product availability
  
  // Yangi qo'shilgan maydonlar
  fullDescription?: string;
  types?: ProductType[];
  ingredients?: Ingredient[];
  preparationMethod?: string;
  preparationTime?: number;
  calories?: number;
  allergens?: string[];
  tags?: string[];
  additionalImages?: string[];
  priceHistory?: Array<{
    price: number;
    date: string;
  }>;
  ratingCount?: number;
  metaTitle?: string;
  metaDescription?: string;
  viewCount?: number;
  orderCount?: number;
  createdBy?: string;
  lastModifiedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Virtual maydonlar
  averageRating?: number;
  isPopular?: boolean;
  isNew?: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Order {
  _id:string;
  user: User;
  orderItems: [{
    product: Product,
    quantity: number,
  }];
  totalPrice: number;
  total?: number; // for backward compatibility
  status: string;
  createdAt: string;
}

export interface Reservation {
  _id: string;
  user: User;
  date: string;
  time: string;
  guests: number;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  createdAt: string;
}

export interface Payment {
  _id: string;
  user: User;
  order?: Order;
  reservation?: Reservation;
  amount: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed';
  type: 'order' | 'reservation';
  transactionId?: string;
  createdAt: string;
} 