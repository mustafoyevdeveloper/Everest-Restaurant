import React from 'react';
import MenuItemCard from './MenuItemCard';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
}

interface MenuGridProps {
  items: MenuItem[];
  isItemLiked: (item: MenuItem) => boolean;
  onAddToCart: (item: MenuItem) => void;
  onAddToLiked: (item: MenuItem) => void;
}

const MenuGrid: React.FC<MenuGridProps> = ({
  items,
  isItemLiked,
  onAddToCart,
  onAddToLiked,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 pb-12">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
        {items.map((item, index) => (
          <MenuItemCard
            key={item.id}
            item={item}
            index={index}
            isLiked={isItemLiked(item)}
            onAddToCart={onAddToCart}
            onAddToLiked={onAddToLiked}
          />
        ))}
      </div>
    </div>
  );
};

export default MenuGrid;
