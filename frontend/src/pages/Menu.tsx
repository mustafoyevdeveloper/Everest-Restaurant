import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, Filter } from 'lucide-react';
import { useMenu } from '@/hooks/useMenu';
import MenuItemCard from '@/components/Menu/MenuItemCard';
import MenuItemSkeleton from '@/components/Menu/MenuItemSkeleton';
import MenuPagination from '@/components/Menu/MenuPagination';
import { useTranslation } from 'react-i18next';
import { useShopping } from '@/context/ShoppingContext';
import { toast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const Menu = () => {
  const { t } = useTranslation();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  const {
    categories,
    activeCategory,
    currentPage,
    totalPages,
    currentItems,
    itemsPerPage,
    isItemLiked,
    loading,
    handlePageChange,
    handleCategoryChange,
    handleAddToCart,
    handleToggleLike,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
  } = useMenu();

  const { isLiked } = useShopping();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const Filters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input
          type="text"
          placeholder={t('menu_search_placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      {/* Category Select */}
      <Select value={activeCategory} onValueChange={handleCategoryChange}>
        <SelectTrigger>
          <SelectValue placeholder={t('menu_categories_title')} />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {t(category.nameKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* Price Range */}
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder={t('menu_min_price_placeholder')}
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />
        <Input
          type="number"
          placeholder={t('menu_max_price_placeholder')}
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
      </div>
      {/* Sort Order */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full flex justify-between">
            <span>{sortOrder === 'asc' ? t('menu_sort_asc') : t('menu_sort_desc')}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setSortOrder('asc')}>
            {t('menu_sort_asc')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setSortOrder('desc')}>
            {t('menu_sort_desc')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      <div className="pt-32 pb-12 md:pt-40 md:pb-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-800 dark:text-white mb-4">
              {t('menu_title')}
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 dark:text-gray-400 max-w-3xl mx-auto">
              {t('menu_description')}
            </p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        {/* Filters */}
        <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-md p-4 mb-8">
          {/* Mobile Collapsible Filters */}
          <div className="md:hidden">
            <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  {isFiltersOpen ? t('menu_hide_filters') : t('menu_show_filters')}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <Filters />
              </CollapsibleContent>
            </Collapsible>
          </div>
          {/* Desktop Filters */}
          <div className="hidden md:block">
            <Filters />
          </div>
        </div>

        {/* Menu Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <MenuItemSkeleton key={index} />
            ))}
          </div>
        ) : currentItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {currentItems.map((item) => (
              <div key={item._id} className="animate-fade-in">
                <MenuItemCard
                  product={item}
                  isLiked={isLiked(item._id)}
                  onToggleLike={() => handleToggleLike(item)}
                  onAddToCart={(product, quantity) => handleAddToCart(product, quantity)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-slate-500 dark:text-gray-400">{t('menu_no_results')}</p>
          </div>
        )}

        {totalPages > 1 && !loading && (
          <div className="mt-12">
            <div className="text-center mb-4">
              <p className="text-sm text-slate-500 dark:text-gray-400">
                {t('menu_showing')} {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, currentItems.length + ((currentPage - 1) * itemsPerPage))} {t('menu_of')} {currentItems.length + ((totalPages - 1) * itemsPerPage)} {t('menu_items')}
              </p>
              <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
                {windowWidth < 768 ? t('menu_mobile_items_info') : t('menu_desktop_items_info')}
              </p>
            </div>
            <MenuPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;
