import React from 'react';
import { Button } from '@/components/ui/button';

interface Category {
  id: string;
  name: string;
}

interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 mb-8">
      <div className="flex overflow-x-auto pb-4 space-x-2 hide-scrollbar">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={activeCategory === category.id ? "default" : "outline"}
            className={`whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 py-2 transition-all duration-300 border-0 ${
              activeCategory === category.id 
                ? "bg-slate-800 text-white dark:bg-yellow-400 dark:text-slate-900 shadow-lg" 
                : "text-slate-600 dark:text-cyan-400 hover:bg-slate-200 dark:hover:bg-cyan-400/10"
            }`}
            onClick={() => onCategoryChange(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
