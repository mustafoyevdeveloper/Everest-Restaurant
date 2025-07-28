import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, UtensilsCrossed, Mail, User, AlertCircle } from 'lucide-react';
import { useShopping } from '@/context/ShoppingContext';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';

const iconClass = "w-4 h-4 text-slate-600 dark:text-gray-300";
const iconContainerClass = "p-2 flex items-center justify-center";

const MobileTopNavbar: React.FC = () => {
  const { cartCount, likedCount } = useShopping();
  const { user, isProfileComplete, isNewUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleNavigation = (path: string, e?: React.MouseEvent) => {
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

  const handleChatbotScroll = () => {
    const chatbot = document.getElementById('chatbot');
    if (chatbot) {
      chatbot.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="md:hidden fixed top-0 left-0 w-full z-50 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 backdrop-blur-sm h-16 flex items-center px-3 justify-between">
      {/* Left: Logo and Brand */}
      <Link to="/" className="flex items-center gap-3">
        <UtensilsCrossed className="w-8 h-8 text-yellow-400"/>
        <span className="text-xl font-display font-bold text-slate-800 dark:text-white gradient-text">{t('brand_name')}</span>
      </Link>
      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <ThemeToggle/>
        <LanguageSwitcher/>
        <Link to="/liked" className={iconContainerClass + ' relative'} onClick={(e) => handleNavigation('/liked', e)}>
          <Heart className={iconClass} />
          {likedCount > 0 && <Badge className="absolute -top-1 -right-1 h-3 w-3 justify-center p-0 text-[10px]">{likedCount}</Badge>}
        </Link>
        <Link to="/cart" className={iconContainerClass + ' relative'} onClick={(e) => handleNavigation('/cart', e)}>
          <ShoppingCart className={iconClass} />
          {cartCount > 0 && <Badge className="absolute -top-1 -right-1 h-3 w-3 justify-center p-0 text-[10px]">{cartCount}</Badge>}
        </Link>
        <Link to="/contact" className={iconContainerClass}>
          <Mail className={iconClass} />
        </Link>
        {user ? (
          <Link to="/profile" className={iconContainerClass + ' relative'}>
            <User className={iconClass} />
            {!isProfileComplete() && (
              <AlertCircle className="w-2 h-2 absolute -top-1 -right-1 text-red-500" />
            )}
          </Link>
        ) : (
          <Link to="/login" className={iconContainerClass}>
            <User className={iconClass} />
          </Link>
        )}
      </div>
    </header>
  );
};

export default MobileTopNavbar; 