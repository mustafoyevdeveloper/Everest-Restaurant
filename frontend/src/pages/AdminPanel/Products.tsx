import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, Trash, Plus, Loader2, Star, Package, DollarSign, Image as ImageIcon, Upload, Link, X, Search, Filter, Grid, List, Eye, EyeOff, ShoppingCart, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import ProductForm from '@/components/Admin/ProductForm';
import { useTranslation } from 'react-i18next';

// CSS stillar
const styles = `
  .line-clamp-1 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }
  .line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .admin-section {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  }
  .dark .admin-section {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  }
  .admin-title {
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .admin-button {
    box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.3);
    transition: all 0.3s ease;
  }
  .admin-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px 0 rgba(59, 130, 246, 0.4);
  }
  .admin-modal {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.95);
  }
  .dark .admin-modal {
    background: rgba(15, 23, 42, 0.95);
  }
  .admin-form-group {
    position: relative;
  }
  .admin-form-input {
    transition: all 0.3s ease;
    border: 2px solid transparent;
    background: rgba(255, 255, 255, 0.8);
  }
  .dark .admin-form-input {
    background: rgba(30, 41, 59, 0.8);
  }
  .admin-form-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

interface Product {
  _id: string;
  nameKey: string;
  descriptionKey: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  quantity: number;
  isAvailable: boolean;
  fullDescription?: string;
  types?: Array<{
    name: string;
    price: number;
    description?: string;
  }>;
  ingredients?: Array<{
    name: string;
    description?: string;
  }>;
  preparationMethod?: string;
  preparationTime?: number;
  calories?: number;
  allergens?: string[];
  tags?: string[];
  additionalImages?: string[];
  metaTitle?: string;
  metaDescription?: string;
  viewCount?: number;
  orderCount?: number;
  createdAt?: string;
  updatedAt?: string;
  name_uz?: string;
  name_ru?: string;
  name_en?: string;
  description_uz?: string;
  description_ru?: string;
  description_en?: string;
}

interface ProductFormData {
  nameKey: string;
  descriptionKey: string;
  name_uz?: string;
  name_ru?: string;
  name_en?: string;
  description_uz?: string;
  description_ru?: string;
  description_en?: string;
  price: string;
  image: string;
  category: string;
  rating: number;
  quantity: string;
  isAvailable: boolean;
  fullDescription: string;
  types: Array<{
    name: string;
    price: number;
    description?: string;
  }>;
  ingredients: Array<{
    name: string;
    description?: string;
  }>;
  preparationMethod: string;
  preparationTime: string;
  calories: string;
  allergens: string[];
  tags: string[];
  additionalImages: string[];
  metaTitle: string;
  metaDescription: string;
}

const AdminProducts: React.FC = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [formData, setFormData] = useState<ProductFormData>({
    nameKey: '',
    descriptionKey: '',
    price: '',
    image: '',
    category: '',
    rating: 4.5,
    quantity: '',
    isAvailable: true,
    fullDescription: '',
    types: [],
    ingredients: [],
    preparationMethod: '',
    preparationTime: '15',
    calories: '',
    allergens: [],
    tags: [],
    additionalImages: [],
    metaTitle: '',
    metaDescription: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'uz';

  // Helper function to normalize category names
  const normalizeCategory = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'Appetizers': 'appetizers',
      'Main Courses': 'main_courses',
      'Desserts': 'desserts',
      'Beverages': 'beverages',
      'Pizza': 'pizza',
      'Pasta': 'pasta',
      'Salads': 'salads',
      'Seafood': 'seafood',
      'Steaks': 'steaks',
      'Soups': 'soups',
      'Grilled': 'grilled',
      'Vegan': 'vegan',
      'Sushi': 'sushi',
      'Sandwiches': 'sandwiches',
      'Breakfast': 'breakfast',
      'Kids': 'kids',
      'Specials': 'specials',
      'Cocktails': 'cocktails',
      'Smoothies': 'smoothies'
    };
    
    return categoryMap[category] || category;
  };

  const categories = [
    { value: 'all', label: t('admin.products.allCategories'), icon: '' },
    { value: 'appetizers', label: t('menu_category_appetizers'), icon: '' },
    { value: 'main_courses', label: t('menu_category_main_courses'), icon: '' },
    { value: 'desserts', label: t('menu_category_desserts'), icon: '' },
    { value: 'beverages', label: t('menu_category_beverages'), icon: '' },
    { value: 'pizza', label: t('menu_category_pizza'), icon: '' },
    { value: 'pasta', label: t('menu_category_pasta'), icon: '' },
    { value: 'salads', label: t('menu_category_salads'), icon: '' },
    { value: 'seafood', label: t('menu_category_seafood'), icon: '' },
    { value: 'steaks', label: t('menu_category_steaks'), icon: '' },
    { value: 'soups', label: t('menu_category_soups'), icon: '' },
    { value: 'grilled', label: t('menu_category_grilled'), icon: '' },
    { value: 'vegan', label: t('menu_category_vegan'), icon: '' },
    { value: 'sushi', label: t('menu_category_sushi'), icon: '' },
    { value: 'sandwiches', label: t('menu_category_sandwiches'), icon: '' },
    { value: 'breakfast', label: t('menu_category_breakfast'), icon: '' },
    { value: 'kids', label: t('menu_category_kids'), icon: '' },
    { value: 'specials', label: t('menu_category_specials'), icon: '' },
    { value: 'cocktails', label: t('menu_category_cocktails'), icon: '' },
    { value: 'smoothies', label: t('menu_category_smoothies'), icon: '' }
  ];

  const ratingOptions = [
    { value: 0, label: t('admin.products.noRating'), stars: 0 },
    { value: 1, label: t('admin.products.oneStar'), stars: 1 },
    { value: 2, label: t('admin.products.twoStars'), stars: 2 },
    { value: 3, label: t('admin.products.threeStars'), stars: 3 },
    { value: 4, label: t('admin.products.fourStars'), stars: 4 },
    { value: 5, label: t('admin.products.fiveStars'), stars: 5 }
  ];

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/products?limit=1000');
      // Handle paginated response structure
      const productsData = data.data?.docs || data.data || [];
      setProducts(productsData);
    } catch (err: any) {
      setError(err.message || t('admin.products.fetchError'));
      toast({ title: t('admin.products.error'), description: err.message || t('admin.products.fetchError'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]); // Empty dependency array - only run once on mount

  // Mobile da viewMode ni har doim 'grid' qilib o'rnatish
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) { // md breakpoint
        setViewMode('grid');
      }
    };

    // Dastlabki tekshirish
    handleResize();

    // Oynaning o'lchami o'zgarganda tekshirish
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      nameKey: '',
      descriptionKey: '',
      price: '',
      image: '',
      category: '',
      rating: 4.5,
      quantity: '',
      isAvailable: true,
      fullDescription: '',
      types: [],
      ingredients: [],
      preparationMethod: '',
      preparationTime: '15',
      calories: '',
      allergens: [],
      tags: [],
      additionalImages: [],
      metaTitle: '',
      metaDescription: ''
    });
  }, []);

  const validateForm = useCallback(() => {
    if (!formData.nameKey.trim()) {
      toast({ title: t('admin.products.error'), description: t('admin.products.nameRequired'), variant: 'destructive' });
      return false;
    }
    if (!formData.descriptionKey.trim()) {
      toast({ title: t('admin.products.error'), description: t('admin.products.descriptionRequired'), variant: 'destructive' });
      return false;
    }
    if (formData.price === '') {
      toast({ title: t('admin.products.error'), description: t('admin.products.priceRequired'), variant: 'destructive' });
      return false;
    }
    if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      toast({ title: t('admin.products.error'), description: t('admin.products.priceMustBeNumber'), variant: 'destructive' });
      return false;
    }
    if (!formData.category) {
      toast({ title: t('admin.products.error'), description: t('admin.products.categoryRequired'), variant: 'destructive' });
      return false;
    }
    // Quantity ixtiyoriy, agar kiritilgan bo'lsa tekshirish
    if (formData.quantity && formData.quantity.trim() !== '') {
      if (isNaN(parseInt(formData.quantity)) || parseInt(formData.quantity) < 0) {
        toast({ title: t('admin.products.error'), description: t('admin.products.quantityMustBePositive'), variant: 'destructive' });
        return false;
      }
    }
    return true;
  }, [formData, toast, t]);

  const handleAddProduct = useCallback(async (data: ProductFormData) => {
    setSubmitting(true);
    try {
      const productData = {
        ...data,
        price: parseFloat(data.price),
        quantity: data.quantity ? parseInt(data.quantity) : undefined,
        preparationTime: data.preparationTime ? parseInt(data.preparationTime) : undefined,
        calories: data.calories ? parseInt(data.calories) : undefined
      };

      const newProduct = await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });

      setProducts(prev => [newProduct, ...prev]);
      toast({ title: t('admin.products.success'), description: t('admin.products.productAdded') });
      setIsAddModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('❌ Frontend: Error creating product:', err);
      toast({ title: t('admin.products.error'), description: err.message || t('admin.products.addError'), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [toast, resetForm, t]);

  const handleEditProduct = useCallback(async (data: ProductFormData) => {
    if (!editingProduct) return;
    setSubmitting(true);
    try {
      const productData = {
        ...data,
        price: parseFloat(data.price),
        quantity: data.quantity ? parseInt(data.quantity) : undefined,
        preparationTime: data.preparationTime ? parseInt(data.preparationTime) : undefined,
        calories: data.calories ? parseInt(data.calories) : undefined,
        // Ensure all fields are sent, even if empty or default
        fullDescription: data.fullDescription || '',
        types: data.types || [],
        ingredients: data.ingredients || [],
        preparationMethod: data.preparationMethod || '',
        allergens: data.allergens || [],
        tags: data.tags || [],
        additionalImages: data.additionalImages || [],
        metaTitle: data.metaTitle || '',
        metaDescription: data.metaDescription || ''
      };
      await apiFetch(`/products/${editingProduct._id}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });
      toast({ title: t('admin.products.success'), description: t('admin.products.productUpdated') });
      setIsEditModalOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      toast({ title: t('admin.products.error'), description: err.message || t('admin.products.updateError'), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [editingProduct, resetForm, toast, fetchProducts, t]);

  const handleDeleteProduct = useCallback(async (productId: string) => {
    try {
      await apiFetch(`/products/${productId}`, {
        method: 'DELETE'
      });
      toast({ title: t('admin.products.success'), description: t('admin.products.productDeleted') });
      fetchProducts();
    } catch (err: any) {
      toast({ title: t('admin.products.error'), description: err.message || t('admin.products.deleteError'), variant: 'destructive' });
    }
  }, [toast, t]);

  const handleImageUrlChange = useCallback((url: string) => {
    setFormData(prev => ({ ...prev, image: url }));
  }, []);

  // Rasm URL validation
  const validateImageUrl = useCallback((url: string) => {
    if (!url || url.trim() === '') {
      return { isValid: true, message: t('admin.products.imageUrlOptional') };
    }
    
    // URL bo'sh emas bo'lsa, to'g'ri deb hisoblaymiz
    return { isValid: true, message: t('admin.products.imageUrlValid') };
  }, [t]);

  const openEditModal = useCallback((product: Product) => {
    // console.log('🔍 Opening edit modal for product:', product);
    // console.log('🖼️ Product image URL:', product.image);
    // console.log('🖼️ Product image type:', typeof product.image);
    
    // Rasm URL ni to'g'ri ko'rsatish uchun
    let imageUrl = product.image || '';
    
    // Agar backend dan kelgan URL /uploads/ bilan boshlansa, uni to'g'ridan-to'g'ri ishlatamiz
    if (imageUrl.startsWith('/uploads/')) {
      // console.log('📁 Using uploaded image path:', imageUrl);
    } else if (imageUrl.startsWith('http')) {
      // console.log('🔗 Using external URL:', imageUrl);
    } else if (imageUrl.startsWith('data:image/')) {
      // console.log('📎 Using base64 image:', imageUrl.substring(0, 50) + '...');
    } else {
      // console.log('⚠️ Unknown image format:', imageUrl);
    }
    
    setEditingProduct(product);
    setFormData({
      nameKey: product.nameKey,
      descriptionKey: product.descriptionKey,
      price: product.price.toString(),
      image: imageUrl,
      category: normalizeCategory(product.category),
      rating: product.rating,
      quantity: product.quantity ? product.quantity.toString() : '',
      isAvailable: product.isAvailable,
      fullDescription: product.fullDescription || '',
      types: product.types || [],
      ingredients: product.ingredients || [],
      preparationMethod: product.preparationMethod || '',
      preparationTime: product.preparationTime ? product.preparationTime.toString() : '15',
      calories: product.calories ? product.calories.toString() : '',
      allergens: product.allergens || [],
      tags: product.tags || [],
      additionalImages: product.additionalImages || [],
      metaTitle: product.metaTitle || '',
      metaDescription: product.metaDescription || ''
    });
    // console.log('📝 Form data set with image:', imageUrl);
    setIsEditModalOpen(true);
  }, []);

  const openAddModal = useCallback(() => {
    resetForm();
    setIsAddModalOpen(true);
  }, [resetForm]);

  const getCategoryLabel = useCallback((categoryKey: string) => {
    const normalizedCategory = normalizeCategory(categoryKey);
    const category = categories.find(cat => cat.value === normalizedCategory);
    return category ? category.label : categoryKey;
  }, [categories]);

  const getRatingStars = useCallback((rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  }, []);

  // Optimized filtered products with useMemo
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Category filter
      const normalizedProductCategory = normalizeCategory(product.category);
      if (selectedCategory !== 'all' && normalizedProductCategory !== selectedCategory) {
        return false;
      }
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = product.nameKey.toLowerCase().includes(searchLower);
        const descMatch = product.descriptionKey.toLowerCase().includes(searchLower);
        if (!nameMatch && !descMatch) {
          return false;
        }
      }
      
      // Availability filter
      if (availabilityFilter !== 'all' && product.isAvailable !== (availabilityFilter === 'available')) {
        return false;
      }
      
      return true;
    });
  }, [products, selectedCategory, searchTerm, availabilityFilter]);

  return (
    <div className="admin-section p-4 md:p-6 -mt-6" style={{ backgroundColor: 'rgb(220, 220, 220)' }}>
      <style>{styles}</style>
      {/* Header */}
      <div className="admin-header mb-6">
        <h1 className="admin-title">{t('admin.products.title')}</h1>
        <Button variant="outline" size="sm" onClick={fetchProducts} className="admin-button">
          <RefreshCw className="w-4 h-4 mr-2" /> {t('admin.products.refresh', 'Refresh')}
        </Button>
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-lg">{t('admin.products.filters')}</h3>
          </div>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddModal} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-4 py-3 text-lg w-auto md:min-w-[378px]">
                <Plus className="w-5 h-5" />
                {t('admin.products.addProduct')}
              </Button>
            </DialogTrigger>
            <DialogContent className="admin-modal max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Plus className="w-5 h-5 text-blue-600" />
                  {t('admin.products.addProduct')}
                </DialogTitle>
              </DialogHeader>
              <ProductForm
                onSubmit={handleAddProduct}
                onCancel={() => setIsAddModalOpen(false)}
                loading={submitting}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('admin.products.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-slate-600 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          
          {/* Category Filter */}
          <div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.products.allCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all"> {t('admin.products.allCategories')}</SelectItem>
                {categories.slice(1).map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <span className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Availability Filter */}
          <div>
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.products.allAvailability')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.products.allAvailability')}</SelectItem>
                <SelectItem value="available">
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-green-600" />
                    {t('admin.products.available')}
                  </span>
                </SelectItem>
                <SelectItem value="unavailable">
                  <span className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-red-600" />
                    {t('admin.products.unavailable')}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="flex-1"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex-1"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Results Count */}
        <div className="mt-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t('admin.products.resultsCount', { filtered: filteredProducts.length, total: products.length })}
          </div>
        </div>
      </div>

      {/* Mahsulotlar ro'yxati */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-lg font-medium">{t('admin.products.loading')}</p>
            <p className="text-sm text-gray-500">{t('admin.products.pleaseWait')}</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <div className="text-red-500 mb-4 text-lg">{error}</div>
          <Button onClick={fetchProducts} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('admin.products.retry')}
          </Button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">{t('admin.products.noProducts')}</h3>
          <p className="text-gray-500 mb-4">{t('admin.products.noResults')}</p>
          <Button onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setAvailabilityFilter('all'); }}>
            {t('admin.products.clearFilters')}
          </Button>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
          : "space-y-4"
        }>
          {filteredProducts.map((product) => {
            const productName =
              product[`name_${lang}`] ||
              product.name_uz ||
              product.name_ru ||
              product.name_en ||
              '';
            const productDescription =
              product[`description_${lang}`] ||
              product.description_uz ||
              product.description_ru ||
              product.description_en ||
              '';
            return (
            <div key={product._id} className={viewMode === 'grid' 
              ? "bg-white dark:bg-slate-800 rounded-xl border shadow-sm overflow-hidden hover:shadow-lg transition-all duration-200 group" 
              : "bg-white dark:bg-slate-800 rounded-xl border shadow-sm p-6 hover:shadow-lg transition-all duration-200"
            }>
              {viewMode === 'grid' ? (
                // Grid view
                <>
                  <div className="relative">
                    {product.image ? (
                      <img 
                        src={getImageUrl(product.image)} 
                          alt={productName}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`${product.image ? 'hidden' : ''} w-full h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">{t('admin.products.noImage')}</p>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      <Badge variant="secondary" className="text-xs bg-white/90 dark:bg-slate-800/90">
                        {getCategoryLabel(product.category)}
                      </Badge>
                      <Badge variant={product.isAvailable ? "default" : "destructive"} className="text-xs">
                        {product.isAvailable ? (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {t('admin.products.available')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <EyeOff className="w-3 h-3" />
                            {t('admin.products.unavailable')}
                          </span>
                        )}
                      </Badge>
                    </div>
                    {!product.isAvailable && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive" className="text-lg">{t('admin.products.unavailable')}</Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-1">{productName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{productDescription}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        {getRatingStars(product.rating)}
                        <span className="text-xs text-gray-500">({product.rating})</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-green-600">
                          {product.price.toLocaleString()} {t('admin.products.currency')}
                        </div>
                        <div className="text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <ShoppingCart className="w-3 h-3" />
                            {product.quantity !== undefined ? t('admin.products.quantityCount', { count: product.quantity }) : t('admin.products.quantityNotSpecified')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditModal(product)} className="flex-1">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" className="flex-1">
                            <Trash className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('admin.products.deleteProduct')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('admin.products.deleteConfirm', { name: productName })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('admin.products.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteProduct(product._id)}>
                              {t('admin.products.delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </>
              ) : (
                // List view
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {product.image ? (
                      <img 
                        src={getImageUrl(product.image)} 
                          alt={productName}
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`${product.image ? 'hidden' : ''} w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center`}>
                      <div className="text-center">
                        <ImageIcon className="w-6 h-6 mx-auto text-gray-400" />
                      </div>
                    </div>
                    {!product.isAvailable && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <EyeOff className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                          <h3 className="font-semibold text-lg">{productName}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{productDescription}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-green-600">
                          {product.price.toLocaleString()} {t('admin.products.currency')}
                        </div>
                        <div className="text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <ShoppingCart className="w-3 h-3" />
                            {product.quantity !== undefined ? t('admin.products.quantityCount', { count: product.quantity }) : t('admin.products.quantityNotSpecified')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryLabel(product.category)}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {getRatingStars(product.rating)}
                          <span className="text-xs text-gray-500">({product.rating})</span>
                        </div>
                        <Badge variant={product.isAvailable ? "default" : "destructive"} className="text-xs">
                          {product.isAvailable ? t('admin.products.available') : t('admin.products.unavailable')}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditModal(product)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('admin.products.deleteProduct')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                  {t('admin.products.deleteConfirm', { name: productName })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('admin.products.cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteProduct(product._id)}>
                                {t('admin.products.delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="admin-modal max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Pencil className="w-5 h-5 text-blue-600" />
              {t('admin.products.editProduct')}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            onSubmit={handleEditProduct}
            onCancel={() => {
              setIsEditModalOpen(false);
              setEditingProduct(null);
            }}
            loading={submitting}
            initialData={editingProduct ? {
              nameKey: editingProduct.nameKey,
              descriptionKey: editingProduct.descriptionKey,
              name_uz: editingProduct.name_uz || '',
              name_ru: editingProduct.name_ru || '',
              name_en: editingProduct.name_en || '',
              description_uz: editingProduct.description_uz || '',
              description_ru: editingProduct.description_ru || '',
              description_en: editingProduct.description_en || '',
              price: editingProduct.price.toString(),
              image: editingProduct.image,
              category: normalizeCategory(editingProduct.category),
              rating: editingProduct.rating,
              quantity: editingProduct.quantity ? editingProduct.quantity.toString() : '',
              isAvailable: editingProduct.isAvailable,
              fullDescription: editingProduct.fullDescription || '',
              types: editingProduct.types || [],
              ingredients: editingProduct.ingredients || [],
              preparationMethod: editingProduct.preparationMethod || '',
              preparationTime: editingProduct.preparationTime ? editingProduct.preparationTime.toString() : '15',
              calories: editingProduct.calories ? editingProduct.calories.toString() : '',
              allergens: editingProduct.allergens || [],
              tags: editingProduct.tags || [],
              additionalImages: editingProduct.additionalImages || [],
              metaTitle: editingProduct.metaTitle || '',
              metaDescription: editingProduct.metaDescription || ''
            } : undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts; 