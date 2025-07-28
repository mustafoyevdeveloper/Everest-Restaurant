import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Star, Eye, EyeOff, Package, Image as ImageIcon, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MenuItem } from '@/hooks/useMenu';
import { useShopping } from '@/context/ShoppingContext';
import { toast } from '@/hooks/use-toast';
import { Product } from '@/types';
import { formatCurrency, getImageUrl } from '@/lib/utils';
import ProductDetailModal from './ProductDetailModal';

interface MenuItemCardProps {
  product: Product;
  isLiked: boolean;
  onToggleLike: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  extraBottomContent?: React.ReactNode;
}

const MenuItemCard = ({ product, isLiked, onToggleLike, onAddToCart, extraBottomContent }: MenuItemCardProps) => {
  const { t } = useTranslation();
  const { addToCart } = useShopping();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { i18n } = useTranslation();
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

  // Kategoriya nomini olish
  const getCategoryName = (categoryKey: string) => {
    const normalizedCategory = normalizeCategory(categoryKey);
    return t('menu_category_' + normalizedCategory);
  };

  const handleAddToCart = () => {
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
    
    addToCart(product, 1);
    toast({
      title: 'Savatga qo\'shildi',
      description: `${productName} savatga qo'shildi`,
    });
  };

  const handleOpenDetailModal = () => {
    setIsDetailModalOpen(true);
  };

  return (
    <>
      <Card 
        className={`group overflow-hidden bg-white dark:bg-slate-800/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col animate-fade-in hover:-translate-y-1 cursor-pointer ${!product.isAvailable ? 'opacity-60' : ''}`}
        onClick={(e) => {
          // Prevent modal opening if click is on a button or inside extraBottomContent
          const target = e.target as HTMLElement;
          if (
            target.closest('button') ||
            target.closest('input') ||
            target.closest('a') ||
            target.closest('[data-no-modal]')
          ) {
            return;
          }
          handleOpenDetailModal();
        }}
      >
        <div className="relative overflow-hidden">
          <img 
            src={product.image || '/placeholder.png'}
            alt={productName} 
            className="w-full h-32 sm:h-48 object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden w-full h-32 sm:h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-xs sm:text-sm text-gray-500">Rasm yuklanmadi</p>
            </div>
          </div>
          
          {/* Like button */}
          <Button
            size="icon"
            variant="ghost"
            className={`absolute top-1 right-1 sm:top-2 sm:right-2 rounded-full h-8 w-8 sm:h-10 sm:w-10 bg-white/20 backdrop-blur-sm hover:bg-white/40 ${isLiked ? 'text-red-500' : 'text-white'}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike(product);
            }}
          >
            <Heart fill={isLiked ? 'currentColor' : 'none'} className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          
          {/* Kategoriya badge */}
          <div className="absolute top-1 left-1 sm:top-2 sm:left-2">
            <Badge variant="secondary" className="bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-white text-xs font-medium">
              {getCategoryName(product.category)}
            </Badge>
          </div>
          
          {/* Availability overlay */}
          {!product.isAvailable && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive" className="text-sm sm:text-lg font-semibold">
                <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {t('product_unavailable')}
              </Badge>
            </div>
          )}
          
          {/* Quantity indicator */}
          {product.quantity !== undefined && product.quantity <= 5 && (
            <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2">
              <Badge variant={product.quantity > 0 ? "secondary" : "destructive"} className={`${product.quantity > 0 ? 'bg-orange-500' : 'bg-red-500'} text-white text-xs`}>
                <Package className="w-3 h-3 mr-1" />
                {t('product_quantity_left_badge', { count: product.quantity })}
              </Badge>
            </div>
          )}
        </div>
        
        <CardContent className="p-3 sm:p-4 flex-grow flex flex-col">
          <div className="flex-grow">
            <div className="hover:text-blue-600 transition-colors">
              <h3 className="text-sm sm:text-lg font-bold text-slate-800 dark:text-white mb-1 line-clamp-1">{productName}</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mb-3 sm:mb-4 h-8 sm:h-10 line-clamp-2">{productDescription}</p>
            </div>
            {/* Remove the productDescription and any <p> or elements that show the description or extra info. Only show product name, price, image, availability, and add to cart button. */}
          </div>
          
          <div className="flex justify-between items-center mt-3 sm:mt-4">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" fill="currentColor" />
              <span className="font-bold text-slate-700 dark:text-white text-sm sm:text-base">{product.rating.toFixed(1)}</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-slate-800 dark:text-yellow-400">{formatCurrency(product.price)}</span>
          </div>
          
          {/* Availability status */}
          <div className="flex items-center justify-between mt-2 mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              {product.isAvailable ? (
                <Badge variant="default" className="bg-green-500 text-white text-xs">
                  <Eye className="w-3 h-3 mr-1" />
                  {t('product_available')}
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <EyeOff className="w-3 h-3 mr-1" />
                  {t('product_unavailable')}
                </Badge>
              )}
            </div>
            {product.quantity !== undefined && (
              <div className="text-xs text-gray-500">
                {t('product_quantity', { count: product.quantity })}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              className={`flex-1 mt-3 sm:mt-4 font-semibold text-sm sm:text-base ${
                !product.isAvailable || (product.quantity !== undefined && product.quantity <= 0)
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-slate-800 text-white dark:bg-gradient-to-r dark:from-cyan-400 dark:to-purple-500 dark:text-slate-900 hover:bg-slate-700 dark:hover:from-cyan-500 dark:hover:to-purple-600'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              disabled={!product.isAvailable || (product.quantity !== undefined && product.quantity <= 0)}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline ml-2">
                {!product.isAvailable || (product.quantity !== undefined && product.quantity <= 0)
                  ? t('product_unavailable')
                  : t('menu_item_add_to_cart')
                }
              </span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="mt-3 sm:mt-4"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetailModal();
              }}
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
          
          {extraBottomContent && (
            <div className="mt-3 sm:mt-4" data-no-modal>{extraBottomContent}</div>
          )}
        </CardContent>
      </Card>
      
      {/* Product Detail Modal */}
      <ProductDetailModal
        product={product}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        isLiked={isLiked}
        onToggleLike={onToggleLike}
      />
    </>
  );
};

export default MenuItemCard;
