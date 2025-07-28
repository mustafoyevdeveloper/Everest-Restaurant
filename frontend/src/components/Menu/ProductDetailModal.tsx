import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  Clock, 
  Flame, 
  Package, 
  Eye,
  EyeOff,
  UtensilsCrossed,
  TrendingUp,
  Award,
  X,
  Info
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useShopping } from '@/context/ShoppingContext';
import { toast } from '@/hooks/use-toast';
import { Product } from '@/types';
import { formatCurrency, getImageUrl } from '@/lib/utils';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  isLiked: boolean;
  onToggleLike: (product: Product) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  isLiked,
  onToggleLike
}) => {
  const { t, i18n } = useTranslation();
  const { addToCart } = useShopping();
  
  const [selectedType, setSelectedType] = useState<number>(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedType(0);
      setQuantity(1);
      setSelectedImage(0);
    }
  }, [isOpen]);

  // Increment view count when modal opens
  useEffect(() => {
    if (isOpen && product) {
      const incrementViewCount = async () => {
        try {
          await apiFetch(`/products/${product._id}/view`, { method: 'POST' });
        } catch (error) {
          console.error('Error incrementing view count:', error);
        }
      };
      incrementViewCount();
    }
  }, [isOpen, product]);

  const handleAddToCart = () => {
    if (!product) return;
    
    if (!product.isAvailable) {
      toast({
        title: 'Mahsulot mavjud emas',
        description: 'Bu mahsulot hozirda sotuvda yo\'q',
        variant: 'destructive',
      });
      return;
    }
    
    if (product.quantity !== undefined && product.quantity <= 0) {
      toast({
        title: 'Mahsulot tugagan',
        description: 'Bu mahsulot hozirda tugagan',
        variant: 'destructive',
      });
      return;
    }

    const productToAdd = product.types && product.types.length > 0 
      ? { ...product, price: product.types[selectedType].price }
      : product;

    addToCart(productToAdd, quantity);
    toast({
      title: 'Savatga qo\'shildi',
      description: `${product.name} savatga qo'shildi`,
    });
  };

  const handleToggleLike = () => {
    if (!product) return;
    onToggleLike(product);
  };

  if (!product) return null;

  const lang = i18n.language || 'uz';
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
  const currentPrice = product.types && product.types.length > 0 
    ? product.types[selectedType].price 
    : product.price;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-bold">{productName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rasmlar */}
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={getImageUrl(
                  product.additionalImages && product.additionalImages.length > 0
                    ? product.additionalImages[selectedImage]
                    : product.image
                )} 
                alt={productName}
                className="w-full h-64 lg:h-80 object-cover rounded-lg"
              />
              
              {/* Like button */}
              <Button
                size="icon"
                variant="ghost"
                className={`absolute top-4 right-4 rounded-full h-10 w-10 bg-white/20 backdrop-blur-sm hover:bg-white/40 ${
                  isLiked ? 'text-red-500' : 'text-white'
                }`}
                onClick={handleToggleLike}
              >
                <Heart fill={isLiked ? 'currentColor' : 'none'} className="w-5 h-5" />
              </Button>

              {/* Availability overlay */}
              {!product.isAvailable && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <Badge variant="destructive" className="text-lg font-semibold">
                    <EyeOff className="w-4 h-4 mr-2" />
                    {t('product_unavailable')}
                  </Badge>
                </div>
              )}
            </div>

            {/* Qo'shimcha rasmlar */}
            {product.additionalImages && product.additionalImages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {[product.image, ...product.additionalImages].map((image, index) => (
                  <img
                    key={index}
                    src={getImageUrl(image)}
                    alt={`${productName} ${index + 1}`}
                    className={`w-16 h-16 object-cover rounded cursor-pointer border-2 ${
                      selectedImage === index ? 'border-blue-500' : 'border-transparent'
                    }`}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Ma'lumotlar */}
          <div className="space-y-4">
            {/* Asosiy ma'lumotlar */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-sm">
                  {t(`menu_category_${product.category}`)}
                </Badge>
                {product.isNew && (
                  <Badge variant="default" className="bg-green-500 text-white text-sm">
                    <Award className="w-3 h-3 mr-1" />
                    {t('product_new')}
                  </Badge>
                )}
                {product.isPopular && (
                  <Badge variant="default" className="bg-orange-500 text-white text-sm">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {t('product_popular')}
                  </Badge>
                )}
              </div>
              
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                {productName}
              </h2>
              
              <p className="text-slate-600 dark:text-gray-400 mb-3">
                {productDescription}
              </p>

              {/* Reyting */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                  <span className="font-bold text-slate-700 dark:text-white">
                    {product.rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-slate-500 dark:text-gray-400 text-sm">
                  ({product.ratingCount || 0} {t('product_rating_count')})
                </span>
              </div>

              {/* Narx */}
              <div className="text-2xl font-bold text-slate-800 dark:text-yellow-400 mb-3">
                {formatCurrency(currentPrice)}
              </div>
            </div>

            {/* Mahsulot turlari */}
            {product.types && product.types.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  {t('product_types')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.types.map((type, index) => (
                    <Button
                      key={index}
                      variant={selectedType === index ? "default" : "outline"}
                      className="justify-between text-sm"
                      onClick={() => setSelectedType(index)}
                    >
                      <span>{type.name}</span>
                      <span className="font-bold">{formatCurrency(type.price)}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Miqdor */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-gray-300">
                  {t('product_quantity_label')}
                </span>
                <div className="flex items-center border rounded-lg">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-8 w-8"
                  >
                    -
                  </Button>
                  <span className="px-3 py-1 min-w-[40px] text-center">
                    {quantity}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-8 w-8"
                  >
                    +
                  </Button>
                </div>
              </div>
              {product.quantity !== undefined && (
                <Badge variant={product.quantity > 0 ? "secondary" : "destructive"} className={`${product.quantity > 0 ? 'bg-orange-500' : 'bg-red-500'} text-white`}>
                  <Package className="w-3 h-3 mr-1" />
                  {t('product_quantity_left_badge', { count: product.quantity })}
                </Badge>
              )}
            </div>

            {/* Savatga qo'shish */}
            <Button 
              className="w-full h-12 text-lg font-semibold"
              onClick={handleAddToCart}
              disabled={!product.isAvailable || (product.quantity !== undefined && product.quantity <= 0)}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {!product.isAvailable || (product.quantity !== undefined && product.quantity <= 0)
                ? t('product_unavailable')
                : t('product_add_to_cart')
              }
            </Button>

            {/* Qo'shimcha ma'lumotlar */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {product.calories && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400">
                  <Flame className="w-4 h-4" />
                  <span>{t('product_calories')}: {product.calories} kcal</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal; 