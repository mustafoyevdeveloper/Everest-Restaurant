import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useShopping } from '@/context/ShoppingContext';
import { apiFetch } from '@/lib/api';
import { categories as allCategories } from '@/data/menuData';
import { useTranslation } from 'react-i18next';

export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  nameKey?: string;
  descriptionKey?: string;
  price: number;
  category: string;
  image: string;
  rating: number;
}

// Use all available categories from menuData
const categories = allCategories;

export const useMenu = () => {
  const { addToCart, toggleLike, likedItems, cartItems } = useShopping();
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Responsive items per page
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const itemsPerPage = 20; // Mobile ko'rinishda 20 ta mahsulot
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const { t } = useTranslation();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await apiFetch('/products?limit=1000');
        // Handle paginated response structure
        const products = response.data?.docs || response.data || [];
        setMenuItems(products);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          title: "Error loading menu",
          description: "Failed to load menu items.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Helper function to check if item is liked
  const isItemLiked = (item: MenuItem) => {
    return likedItems.some(liked =>
      (liked._id && (liked._id === item._id || liked._id === String(item.id))) ||
      (liked.id && (liked.id === item.id || liked.id === String(item._id)))
    );
  };

  // Helper function to get quantity of item in cart
  const getCartQuantity = (item: MenuItem) => {
    const found = cartItems.find(cart =>
      (cart._id && (cart._id === item._id || cart._id === String(item.id))) ||
      (cart.id && (cart.id === item.id || cart.id === String(item._id)))
    );
    return found?.quantity || 0;
  };

  // Filter items based on active category, search query, and price range
  const filteredItems = menuItems.filter(item => {
    // Kategoriya filtri - backend dan kelgan category fieldi bilan solishtirish
    const normalizedItemCategory = normalizeCategory(item.category);
    const matchesCategory = activeCategory === 'all' || normalizedItemCategory === activeCategory;
    
    // Qidiruv filtri - mahsulot nomi va tavsifida qidirish
    const itemName = item.nameKey ? t(item.nameKey) : item.name;
    const itemDescription = item.descriptionKey ? t(item.descriptionKey) : item.description;
    const searchText = `${itemName} ${itemDescription}`.toLowerCase();
    const matchesSearch = searchQuery === '' || searchText.includes(searchQuery.toLowerCase());
    
    // Narx filtri
    const matchesMin = minPrice === '' || item.price >= parseFloat(minPrice);
    const matchesMax = maxPrice === '' || item.price <= parseFloat(maxPrice);
    
    return matchesCategory && matchesSearch && matchesMin && matchesMax;
  });

  // Sort items by price
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortOrder === 'asc') return a.price - b.price;
    return b.price - a.price;
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sortedItems.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  // Handle add to cart
  const handleAddToCart = (item: MenuItem, quantity: number) => {
    addToCart(item, quantity);
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart.`,
    });
  };

  // Handle add to liked
  const handleToggleLike = (item: MenuItem) => {
    toggleLike(item);
  };

  return {
    categories,
    activeCategory,
    currentPage,
    totalPages,
    currentItems,
    itemsPerPage,
    isItemLiked,
    getCartQuantity,
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
  };
};
