import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Product } from '@/types';
import MenuItemSkeleton from '../Menu/MenuItemSkeleton';
import MenuItemCard from '../Menu/MenuItemCard';
import { useShopping } from '@/context/ShoppingContext';

const FeaturedDishes = () => {
  const { t } = useTranslation();
  const { likedItems, toggleLike, addToCart } = useShopping();

  const { data: featuredResponse, isLoading } = useQuery<{ data: { docs: Product[] } }>({
    queryKey: ['featured-products'],
    queryFn: () => apiFetch('/products?sortBy=rating&sortOrder=desc&limit=20'),
  });

  // Extract products from paginated response
  const featured = featuredResponse?.data?.docs || [];

  // Helper to get 8 random products
  function getRandomProducts(products: Product[], count: number) {
    if (!products || !Array.isArray(products)) return [];
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
  const randomFeatured = getRandomProducts(featured, 8);

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.6,
        ease: 'easeOut',
      },
    }),
  };

  return (
    <section className="py-20 sm:py-32 bg-slate-50 dark:bg-slate-800/50 overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-800 dark:text-white mb-4">
            {t('popular_dishes_title', 'Mashhur Taomlar')}
          </h2>
          <p className="text-lg text-slate-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('popular_dishes_subtitle', "Eng sevimlilarini tatib ko'ring, siz uchun maxsus tanlangan.")}
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <MenuItemSkeleton key={i} />)
          ) : (
            randomFeatured.map((item, i) => (
              <motion.div
                key={item._id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                className="h-full"
              >
                <MenuItemCard 
                  product={item}
                  isLiked={likedItems.some(likedItem => likedItem._id === item._id)}
                  onToggleLike={toggleLike}
                  onAddToCart={addToCart}
                />
              </motion.div>
            ))
          )}
        </div>

        <div className="text-center mt-16">
          <Button asChild size="lg" className="bg-slate-800 text-white hover:bg-slate-700 dark:bg-amber-500 dark:text-black dark:hover:bg-amber-600">
            <Link to="/menu">{t('popular_dishes_button', "To'liq menyu")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDishes;
