import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { useShopping } from '@/context/ShoppingContext';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { MenuItem } from '@/context/ShoppingContext';
import { menuItems } from '@/data/menuData';
import MenuItemCard from '@/components/Menu/MenuItemCard';

const Cart = () => {
  const { t } = useTranslation();
  const {
    cartItems,
    removeFromCart,
    updateCartItemQuantity,
    cartTotal: subtotal,
    clearCart,
  } = useShopping();
  const { user } = useAuth();
  const navigate = useNavigate();

  const taxRate = 0.1; // 10% tax
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity > 0) {
      updateCartItemQuantity(productId, quantity);
    } else {
      removeFromCart(productId);
    }
  };

  const handleCheckout = () => {
    if (user) {
      navigate('/checkout');
    } else {
      toast({
        title: t('toast_login_required_title'),
        description: t('toast_login_required_desc'),
        variant: 'destructive',
        action: (
          <Button onClick={() => navigate('/login')} variant="outline">{t('login')}</Button>
        ),
      });
    }
  };

  const handleRemoveAllCart = async () => {
    await clearCart();
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-6 md:py-8 text-center min-h-[calc(100vh-8rem)] flex flex-col justify-center items-center">
        <div className="bg-white dark:glass-card p-6 md:p-10 text-center animate-fade-in max-w-2xl mx-auto rounded-lg shadow-lg">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center">
              <CreditCard className="h-8 w-8 md:h-10 md:w-10 text-slate-400 dark:text-gray-400" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mb-2">{t('cart_empty_title')}</h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-gray-400 mb-6 md:mb-8">{t('cart_empty_desc')}</p>
            <Button asChild className="h-10 md:h-11">
              <Link to="/menu">{t('cart_go_to_menu')}</Link>
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-8 md:py-12 pt-16 md:pt-20 sm:pt-24 md:pt-28">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-slate-800 dark:text-white mb-2 md:mb-4">
          {t('cart_title')}
        </h1>
        <p className="text-sm md:text-xl lg:text-2xl text-slate-500 dark:text-gray-400 max-w-3xl mx-auto px-2">
          {t('cart_description')}
        </p>
      </div>
      {cartItems.length > 0 && (
        <div className="flex justify-end mb-4">
          <Button variant="destructive" size="sm" className="h-8 md:h-10 text-xs md:text-sm" onClick={handleRemoveAllCart}>
            {t('cart_remove_all', 'Remove All')}
          </Button>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-12">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {cartItems.map((item, index) => (
            <MenuItemCard
              key={item.cartItemId || item._id}
              product={{
                ...item,
                image: item.image || '/placeholder.svg',
                rating: typeof item.rating === 'number' ? item.rating : (item.rating?.rate || 0),
              }}
              isLiked={false}
              onToggleLike={() => {}}
              onAddToCart={() => {}}
              extraBottomContent={
                <div className="flex justify-between items-center mt-3 md:mt-4">
                  <div className="flex items-center space-x-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 md:h-8 md:w-8 rounded-full"
                      onClick={() => handleUpdateQuantity(item._id, (item.quantity || 1) - 1)}
                    >
                      <Minus className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    <span className="font-bold text-base md:text-lg w-6 md:w-8 text-center">{item.quantity || 1}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 md:h-8 md:w-8 rounded-full"
                      onClick={() => handleUpdateQuantity(item._id, (item.quantity || 1) + 1)}
                    >
                      <Plus className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full h-8 w-8 md:h-10 md:w-10 bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white hover:text-red-500"
                    onClick={() => removeFromCart(item.cartItemId || item._id)}
                  >
                    <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </div>
              }
            />
          ))}
        </div>
        
        <div className="lg:sticky lg:top-24 z-30">
          <Card className="bg-white dark:glass-card shadow-lg">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-2xl font-display text-slate-800 dark:text-white">{t('order_summary')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="flex justify-between">
                <span className="text-sm md:text-base text-slate-500 dark:text-gray-400">{t('cart_subtotal')}</span>
                <span className="font-medium text-sm md:text-base text-slate-800 dark:text-white">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm md:text-base text-slate-500 dark:text-gray-400">{t('cart_tax')} ({(taxRate * 100).toFixed(0)}%)</span>
                <span className="font-medium text-sm md:text-base text-slate-800 dark:text-white">{formatCurrency(tax)}</span>
              </div>
              <Separator className="dark:bg-white/10" />
              <div className="flex justify-between items-center">
                <span className="text-base md:text-lg font-bold text-slate-800 dark:text-white">{t('cart_total')}</span>
                <span className="text-xl md:text-2xl font-bold text-amber-600 dark:text-yellow-400">{formatCurrency(total)}</span>
              </div>
            </CardContent>
          </Card>
          <div className="mt-4 md:mt-6">
            <Button className="w-full text-sm md:text-lg h-11 md:h-12" size="lg" onClick={handleCheckout}>
              <CreditCard className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              {t('proceed_to_checkout')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
