import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X, User, Heart, ShoppingCart, LogOut, Shield, UtensilsCrossed, Mail, AlertCircle } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useShopping } from '@/context/ShoppingContext';
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '@/lib/api';
import { getGlobalSocket, createSocketManager } from '@/lib/socket';
import { useAdminNotifications } from '@/context/AdminNotificationContext';
import { useToast } from '@/components/ui/use-toast';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount, likedCount } = useShopping();
  const { user, logout, isProfileComplete, isNewUser } = useAuth();
  const { t } = useTranslation();
  const { unreadContactCount, updateUnreadCount } = useAdminNotifications();
  const [socket, setSocket] = useState(null);
  const { toast } = useToast();

  // Navigation blocking for incomplete profile
  const handleNavigation = (path: string, e?: React.MouseEvent) => {
    // Yangi foydalanuvchi (register qilgan) va profil to'liq emas
    if (user && isNewUser() && !isProfileComplete() && path !== '/profile' && path !== '/logout') {
      e?.preventDefault();
      toast({
        title: t('navigation_blocked_title', 'Profil to\'ldirilmagan'),
        description: t('navigation_blocked_desc', 'Davom etish uchun avval profil ma\'lumotlarini to\'ldiring'),
        variant: 'destructive',
      });
      navigate('/profile');
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      // Use existing socket if available, otherwise create new one
      let socketManager = getGlobalSocket();
      
      if (!socketManager) {
        socketManager = createSocketManager({
          url: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
          auth: {
            token: user.token,
            userId: user._id,
            role: user.role,
            name: user.name
          }
        });
      }

      // Check if already connected or connecting
      if (socketManager.isConnected()) {
        // Socket already connected, just add listeners
        socketManager.on('new_contact_message', (data) => {
          updateUnreadCount();
        });
        updateUnreadCount();
        setSocket(socketManager.getSocket());
      } else {
        // Connect only if not already connecting
        const connectWithRetry = (retryCount = 0) => {
        socketManager.connect()
          .then((socket) => {
            setSocket(socket);
            console.log('✅ Navbar socket connected');

            // Yangi xabar kelganda
            socketManager.on('new_contact_message', (data) => {
              updateUnreadCount();
            });

            // Dastlabki sonni olish
            updateUnreadCount();
          })
          .catch((error) => {
            console.error('❌ Failed to connect navbar socket:', error);
              
              // Retry once if it's a connection in progress error
              if (error.message.includes('Connection already in progress') && retryCount < 1) {
                console.log('🔄 Retrying socket connection...');
                setTimeout(() => connectWithRetry(retryCount + 1), 1000);
              }
            });
        };
        
        connectWithRetry();
      }
    }

    // Cleanup function to remove event listeners
    return () => {
      const socketManager = getGlobalSocket();
      if (socketManager) {
        socketManager.off('new_contact_message');
      }
    };
  }, [user, updateUnreadCount]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const baseNavLinks = [
    { href: '/', label: t('nav_home') },
    { href: '/menu', label: t('nav_menu') },
    { href: '/reservations', label: t('nav_reservations') },
  ];

  const userNavLinks = user && user.role !== 'admin' ? [{ href: '/my-bookings', label: t('nav_my_bookings') }] : [];
  const adminNavLinks = user && user.role === 'admin' ? [{ href: '/admin', label: t('nav_admin_panel') }] : [];

  const desktopNavLinks = [...baseNavLinks, ...userNavLinks];

  return (
    <>
      <header className="hidden md:block fixed top-0 left-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            {/* Site branding */}
            <div className="flex-shrink-0 mr-4">
              <Link to="/" className="flex items-center">
                <UtensilsCrossed className="w-8 h-8 text-yellow-400" />
                <span className="ml-2 text-2xl font-display font-bold text-slate-800 dark:text-white gradient-text">{t('brand_name')}</span>
              </Link>
            </div>

            {/* Desktop navigation */}
            <nav className="hidden md:flex md:grow">
              <ul className="flex grow justify-center flex-wrap items-center">
                {desktopNavLinks.map((link) => (
                  <li key={link.href}>
                    <NavLink
                      to={link.href}
                      onClick={(e) => handleNavigation(link.href, e)}
                      className={({ isActive }) =>
                        cn(
                          'font-medium text-slate-600 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400 px-4 py-2 flex items-center transition duration-150 ease-in-out',
                          isActive && 'text-yellow-500 dark:text-yellow-400'
                        )
                      }
                    >
                      {link.label}
                    </NavLink>
                  </li>
                ))}
                {user?.role === 'admin' && (
                  <li className="relative">
                    <NavLink
                      to="/admin"
                      end
                      onClick={(e) => handleNavigation('/admin', e)}
                      className={({ isActive }) =>
                        cn(
                          'font-medium text-slate-600 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400 px-4 py-2 flex items-center transition duration-150 ease-in-out',
                          isActive && 'text-yellow-500 dark:text-yellow-400'
                        )
                      }
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {t('nav_admin_panel')}
                      {unreadContactCount > 0 && (
                        <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow border border-white">
                          {unreadContactCount}
                        </Badge>
                      )}
                    </NavLink>
                  </li>
                )}
              </ul>
            </nav>

            {/* Desktop auth links */}
            <div className="hidden md:flex items-center space-x-1">
              <ThemeToggle />
              <LanguageSwitcher />

              <Link to="/liked" onClick={(e) => handleNavigation('/liked', e)}>
                <Button variant="ghost" size="icon" className="text-slate-600 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400 relative">
                  <Heart className="w-5 h-5" />
                  {likedCount > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{likedCount}</Badge>}
                </Button>
              </Link>
              <Link to="/cart" onClick={(e) => handleNavigation('/cart', e)}>
                <Button variant="ghost" size="icon" className="text-slate-600 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400 relative">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{cartCount}</Badge>}
                </Button>
              </Link>

              <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-2"></div>

              {user ? (
                <>
                  <Link to="/profile">
                    <Button variant="ghost" size="icon" className="text-slate-600 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400 relative">
                      <User className="w-5 h-5" />
                      {!isProfileComplete() && (
                        <AlertCircle className="w-3 h-3 absolute -top-1 -right-1 text-red-500" />
                      )}
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-600 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('nav_logout')}
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm" className="text-slate-600 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400">
                    <Link to="/login">{t('nav_sign_in')}</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-slate-800 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                    <Link to="/signup">{t('nav_sign_up')}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;

