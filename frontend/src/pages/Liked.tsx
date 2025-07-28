import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useShopping } from '@/context/ShoppingContext';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/utils';
import { Product } from '@/types';
import Loader from '@/components/ui/Loader';
import { menuItems } from '@/data/menuData';
import MenuItemCard from '@/components/Menu/MenuItemCard';

const Liked = () => {
  const { t } = useTranslation();
  const { likedItems, toggleLike, addToCart, loading: likesLoading } = useShopping();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const loading = authLoading || likesLoading;

  const handleAddToCart = (item: Product) => {
    addToCart(item, 1);
  };

  const handleRemoveAllLiked = async () => {
    for (const item of likedItems) {
      await toggleLike(item);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center p-4">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center text-center min-h-[calc(100vh-10rem)]">
        <h2 className="text-2xl font-bold mb-4">{t('liked_login_prompt')}</h2>
        <Button onClick={() => navigate('/login')}>{t('liked_login_button')}</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12 pt-20 sm:pt-28">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-800 dark:text-white mb-4">
          {t('liked_title')}
        </h1>
        <p className="text-xl md:text-2xl text-slate-500 dark:text-gray-400 max-w-3xl mx-auto">
          {t('liked_description')}
        </p>
      </div>

      {likedItems.length > 0 ? (
        <>
          <div className="flex justify-end mb-4">
            <Button variant="destructive" onClick={handleRemoveAllLiked}>
              {t('liked_remove_all', 'Remove All')}
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {likedItems.map((item, index) => (
              <MenuItemCard
                key={item._id || item.id}
                product={item}
                isLiked={true}
                onToggleLike={toggleLike}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center">
            <Heart className="h-12 w-12 text-slate-400 dark:text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t('liked_empty_title')}</h2>
          <p className="text-slate-500 dark:text-gray-400 mb-6">{t('liked_empty_description')}</p>
          <Button asChild>
            <Link to="/menu">{t('liked_empty_button')}</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default Liked;
