import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { apiFetch } from "../lib/api";
import { useAuth } from "./AuthContext";
import { useTranslation } from "react-i18next";

// Define the types for our items
export interface MenuItem {
  _id: string;
  name?: string;
  name_uz?: string;
  name_ru?: string;
  name_en?: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  quantity?: number;
  cartItemId?: string;
  nameKey?: string;
}

// Define the context type
interface ShoppingContextType {
  cartItems: MenuItem[];
  likedItems: MenuItem[];
  addToCart: (item: MenuItem, quantity?: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateCartItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  addToLiked: (item: MenuItem) => Promise<void>;
  removeFromLiked: (itemId: string) => Promise<void>;
  toggleLike: (item: MenuItem) => Promise<void>;
  isInCart: (itemId: string) => boolean;
  isLiked: (itemId: string) => boolean;
  cartCount: number;
  likedCount: number;
  cartTotal: number;
  loading: boolean;
  error: string | null;
}

// Create the context with initial state
const ShoppingContext = createContext<ShoppingContextType>({
  cartItems: [],
  likedItems: [],
  addToCart: async () => {},
  removeFromCart: async () => {},
  updateCartItemQuantity: async () => {},
  clearCart: async () => {},
  addToLiked: async () => {},
  removeFromLiked: async () => {},
  toggleLike: async () => {},
  isInCart: () => false,
  isLiked: () => false,
  cartCount: 0,
  likedCount: 0,
  cartTotal: 0,
  loading: false,
  error: null,
});

const formatCartData = (data: any): MenuItem[] => {
  if (data && Array.isArray(data.items)) {
    return data.items
      .filter(item => item.product) // Ensure product is not null
      .map(item => ({
        ...item.product,
        quantity: item.quantity,
        cartItemId: item._id,
        name: item.product.name_uz || item.product.name_ru || item.product.name_en || item.product.name || 'Mahsulot',
      }));
  }
  return [];
};

// Create the provider component
export const ShoppingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<MenuItem[]>([]);
  const [likedItems, setLikedItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  // Fetch cart and liked items from backend on mount or when user changes
  useEffect(() => {
    if (!user) {
      setCartItems([]);
      setLikedItems([]);
      setLoading(false);
      return;
    }

    // Skip cart and favorites fetching for admin users
    if (user.role === 'admin') {
      setCartItems([]);
      setLikedItems([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching cart and favorites for user:', user._id);
        const [cartData, favoritesData] = await Promise.all([
          apiFetch('/cart').catch(err => {
            console.error('Error fetching cart:', err);
            return { items: [] };
          }),
          apiFetch('/favorites').catch(err => {
            console.error('Error fetching favorites:', err);
            return { items: [] };
          })
        ]);
        
        setCartItems(formatCartData(cartData));
        setLikedItems(favoritesData.items || []);
      } catch (err) {
        console.error('Error fetching shopping data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load shopping data');
        // Set empty arrays as fallback
        setCartItems([]);
        setLikedItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Cart operations
  const addToCart = async (item: MenuItem, quantity: number = 1) => {
    if (!user) {
      toast({ title: "Login required", description: "Please login to add items to cart.", variant: "destructive" });
      return;
    }

    // Skip cart operations for admin users
    if (user.role === 'admin') {
      toast({ title: "Not available", description: "Cart operations are not available for admin users.", variant: "destructive" });
      return;
    }
    
    try {
      await apiFetch('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: item._id, quantity })
      });
      // Refresh cart
      const data = await apiFetch('/cart');
      setCartItems(formatCartData(data));
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast({ 
        title: "Error", 
        description: err instanceof Error ? err.message : "Failed to add item to cart", 
        variant: "destructive" 
      });
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (!user) return;

    // Skip cart operations for admin users
    if (user.role === 'admin') return;
    
    try {
      await apiFetch(`/cart/${cartItemId}`, { method: 'DELETE' });
      const data = await apiFetch('/cart');
      setCartItems(formatCartData(data));
      toast({ title: "Item removed", description: "Item removed from your cart." });
    } catch (err) {
      console.error('Error removing from cart:', err);
      toast({ 
        title: "Error", 
        description: err instanceof Error ? err.message : "Failed to remove item from cart", 
        variant: "destructive" 
      });
    }
  };

  const updateCartItemQuantity = async (itemId: string, quantity: number) => {
    if (!user) return;

    // Skip cart operations for admin users
    if (user.role === 'admin') return;
    
    const item = cartItems.find(i => i._id === itemId);
    if (!item) return;

    if (quantity < 1) {
      if (item.cartItemId) {
        return removeFromCart(item.cartItemId);
      }
      return;
    }

    const quantityDifference = quantity - (item.quantity || 0);
    if (quantityDifference === 0) return;

    try {
      await apiFetch('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: item._id, quantity: quantityDifference })
      });
      const data = await apiFetch('/cart');
      setCartItems(formatCartData(data));
    } catch (err) {
      console.error('Error updating cart quantity:', err);
      toast({ 
        title: "Error", 
        description: err instanceof Error ? err.message : "Failed to update quantity", 
        variant: "destructive" 
      });
    }
  };

  const clearCart = async () => {
    if (!user) return;

    // Skip cart operations for admin users
    if (user.role === 'admin') return;
    
    try {
      await apiFetch('/cart/clear', { method: 'DELETE' });
      setCartItems([]);
      toast({ title: "Cart cleared", description: "All items have been removed from your cart." });
    } catch (err) {
      console.error('Error clearing cart:', err);
      toast({ 
        title: "Error", 
        description: err instanceof Error ? err.message : "Failed to clear cart", 
        variant: "destructive" 
      });
    }
  };

  // Liked operations
  const addToLiked = async (item: MenuItem) => {
    if (!user) {
      toast({ title: "Login required", description: "Please login to add favorites.", variant: "destructive" });
      return;
    }

    // Skip favorites operations for admin users
    if (user.role === 'admin') {
      toast({ title: "Not available", description: "Favorites operations are not available for admin users.", variant: "destructive" });
      return;
    }
    
    try {
      await apiFetch('/favorites', {
        method: 'POST',
        body: JSON.stringify({ productId: item._id })
      });
      const data = await apiFetch('/favorites');
      setLikedItems(data.items || []);
    } catch (err) {
      console.error('Error adding to favorites:', err);
      toast({ 
        title: "Error", 
        description: err instanceof Error ? err.message : "Failed to add to favorites", 
        variant: "destructive" 
      });
    }
  };

  const removeFromLiked = async (itemId: string) => {
    if (!user) return;

    // Skip favorites operations for admin users
    if (user.role === 'admin') return;
    
    try {
      await apiFetch(`/favorites/${itemId}`, { method: 'DELETE' });
      const data = await apiFetch('/favorites');
      setLikedItems(data.items || []);
      toast({ title: "Removed from favorites", description: "Item removed from your favorites." });
    } catch (err) {
      console.error('Error removing from favorites:', err);
      toast({ 
        title: "Error", 
        description: err instanceof Error ? err.message : "Failed to remove from favorites", 
        variant: "destructive" 
      });
    }
  };

  const toggleLike = async (item: MenuItem) => {
    // Skip favorites operations for admin users
    if (user?.role === 'admin') {
      toast({ title: "Not available", description: "Favorites operations are not available for admin users.", variant: "destructive" });
      return;
    }

    const liked = isLiked(item._id);
    if (liked) {
      await removeFromLiked(item._id);
      toast({
        title: t('toast_removed_from_favorites_title'),
        description: t('toast_removed_from_favorites_desc', { name: item.nameKey ? t(item.nameKey) : item.name }),
      });
    } else {
      await addToLiked(item);
      toast({
        title: t('toast_added_to_favorites_title'),
        description: t('toast_added_to_favorites_desc', { name: item.nameKey ? t(item.nameKey) : item.name }),
      });
    }
  };

  // Helper functions
  const isInCart = (itemId: string) => cartItems.some(item => item._id === itemId);
  const isLiked = (itemId: string) => likedItems.some(item => item._id === itemId);
  const cartCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
  const likedCount = likedItems.length;
  const cartTotal = cartItems.reduce((total, item) => total + item.price * (item.quantity || 1), 0);

  return (
    <ShoppingContext.Provider
      value={{
        cartItems,
        likedItems,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        addToLiked,
        removeFromLiked,
        toggleLike,
        isInCart,
        isLiked,
        cartCount,
        likedCount,
        cartTotal,
        loading,
        error,
      }}
    >
      {children}
    </ShoppingContext.Provider>
  );
};

// Create a hook to use the shopping context
export const useShopping = () => useContext(ShoppingContext);
