import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Heart, 
  ShoppingCart, 
  Star, 
  Clock, 
  Flame, 
  Package, 
  Eye,
  EyeOff,
  ChefHat,
  UtensilsCrossed,
  Info,
  Calendar,
  TrendingUp,
  Award
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useShopping } from '@/context/ShoppingContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Product } from '@/types';
import { formatCurrency, getImageUrl } from '@/lib/utils';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { likedItems, toggleLike, addToCart } = useShopping();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<number>(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const isLiked = product ? likedItems.some(item => item._id === product._id) : false;

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await apiFetch(`/products/${id}`);
        setProduct(response);
        
        // View count oshirish
        await apiFetch(`/products/${id}/view`, { method: 'POST' });
      } catch (error) {
        console.error('Error fetching product:', error);
        toast({
          title: 'Xatolik',
          description: 'Mahsulot ma\'lumotlari yuklanmadi',
          variant: 'destructive',
        });
        navigate('/menu');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

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
    toggleLike(product);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
              Mahsulot topilmadi
            </h1>
            <Button onClick={() => navigate('/menu')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Menuga qaytish
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const productName = product.nameKey ? t(product.nameKey) : product.name;
  const productDescription = product.descriptionKey ? t(product.descriptionKey) : product.description;
  const currentPrice = product.types && product.types.length > 0 
    ? product.types[selectedType].price 
    : product.price;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-20">
        {/* Orqaga qaytish */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/menu')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Menuga qaytish
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                className="w-full h-96 object-cover rounded-lg"
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
                    className={`w-20 h-20 object-cover rounded cursor-pointer border-2 ${
                      selectedImage === index ? 'border-blue-500' : 'border-transparent'
                    }`}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Ma'lumotlar */}
          <div className="space-y-6">
            {/* Asosiy ma'lumotlar */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-sm">
                  {t(`menu_category_${product.category}`)}
                </Badge>
                {product.isNew && (
                  <Badge variant="default" className="bg-green-500 text-white text-sm">
                    <Award className="w-3 h-3 mr-1" />
                    Yangi
                  </Badge>
                )}
                {product.isPopular && (
                  <Badge variant="default" className="bg-orange-500 text-white text-sm">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Mashhur
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
                {productName}
              </h1>
              
              <p className="text-slate-600 dark:text-gray-400 mb-4">
                {productDescription}
              </p>

              {/* Reyting */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
                  <span className="font-bold text-slate-700 dark:text-white">
                    {product.rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-slate-500 dark:text-gray-400">
                  ({product.ratingCount || 0} baho)
                </span>
              </div>

              {/* Narx */}
              <div className="text-3xl font-bold text-slate-800 dark:text-yellow-400 mb-4">
                {formatCurrency(currentPrice)}
              </div>
            </div>

            {/* Mahsulot turlari */}
            {product.types && product.types.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">
                  Mahsulot turlari
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.types.map((type, index) => (
                    <Button
                      key={index}
                      variant={selectedType === index ? "default" : "outline"}
                      className="justify-between"
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
                  Miqdor:
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
                  {product.quantity} ta qoldi
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
                : 'Savatga qo\'shish'
              }
            </Button>

            {/* Qo'shimcha ma'lumotlar */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {product.preparationTime && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{product.preparationTime} min</span>
                </div>
              )}
              {product.calories && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400">
                  <Flame className="w-4 h-4" />
                  <span>{product.calories} kcal</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Batafsil ma'lumotlar */}
        <div className="mt-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="description">Tavsif</TabsTrigger>
              <TabsTrigger value="ingredients">Ingredientlar</TabsTrigger>
              <TabsTrigger value="preparation">Tayyorlash</TabsTrigger>
              <TabsTrigger value="info">Ma'lumot</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                    To'liq tavsif
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
                    {product.fullDescription || productDescription}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="ingredients" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                    Ingredientlar
                  </h3>
                  {product.ingredients && product.ingredients.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {product.ingredients.map((ingredient, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <UtensilsCrossed className="w-5 h-5 text-slate-400 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-slate-800 dark:text-white">
                              {ingredient.name}
                            </h4>
                            {ingredient.description && (
                              <p className="text-sm text-slate-600 dark:text-gray-400">
                                {ingredient.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 dark:text-gray-400">
                      Ingredientlar ma'lumoti mavjud emas
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preparation" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                    Tayyorlash usuli
                  </h3>
                  {product.preparationMethod ? (
                    <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
                      {product.preparationMethod}
                    </p>
                  ) : (
                    <p className="text-slate-600 dark:text-gray-400">
                      Tayyorlash usuli ma'lumoti mavjud emas
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="info" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                    Qo'shimcha ma'lumotlar
                  </h3>
                  <div className="space-y-4">
                    {product.allergens && product.allergens.length > 0 && (
                      <div>
                        <h4 className="font-medium text-slate-800 dark:text-white mb-2">
                          Allergenlar:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {product.allergens.map((allergen, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {t(`allergen_${allergen}`)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {product.tags && product.tags.length > 0 && (
                      <div>
                        <h4 className="font-medium text-slate-800 dark:text-white mb-2">
                          Maxsus belgilar:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {product.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {t(`tag_${tag}`)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600 dark:text-gray-400">
                          Ko'rishlar: {product.viewCount || 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600 dark:text-gray-400">
                          Buyurtmalar: {product.orderCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ProductDetail; 