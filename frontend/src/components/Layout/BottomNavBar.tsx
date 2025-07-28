import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Menu as MenuIcon, Calendar, BookOpen, User, LogOut, Info, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';

const BottomNavBar: React.FC = () => {
  const { user, logout, isProfileComplete, isNewUser } = useAuth();
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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Always show Home, Menu, Reservations, About
  // Show My Bookings for user, Admin Panel for admin
  const navItems = [
    { to: '/', icon: Home, label: 'nav_home' },
    { to: '/menu', icon: MenuIcon, label: 'nav_menu' },
    { to: '/reservations', icon: Calendar, label: 'nav_reservations' },
    user && user.role === 'admin'
      ? { to: '/admin', icon: Shield, label: 'nav_admin_panel' }
      : { to: '/my-bookings', icon: BookOpen, label: 'nav_my_bookings' },
    { to: '/about', icon: Info, label: 'nav_about' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-white/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 backdrop-blur-sm">
      <ul className="flex justify-around items-center h-16">
        {navItems.map(({ to, icon: Icon, label }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              onClick={(e) => handleNavigation(to, e)}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center text-xs pt-1 transition text-slate-500 dark:text-gray-400 relative',
                  isActive && 'text-yellow-500 dark:text-yellow-400'
                )
              }
              end={to === '/'}
            >
              <Icon className="w-6 h-6 mb-0.5" />
              <span className="text-[10px] leading-none">{t(label)}</span>
              {user && !isProfileComplete() && to !== '/profile' && to !== '/logout' && (
                <AlertCircle className="w-2 h-2 absolute -top-1 -right-1 text-red-500" />
              )}
            </NavLink>
          </li>
        ))}
        {user ? (
          <li className="flex-1">
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center text-xs pt-1 text-slate-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 w-full"
            >
              <LogOut className="w-6 h-6 mb-0.5" />
              <span className="text-[10px] leading-none">{t('nav_logout')}</span>
            </button>
          </li>
        ) : (
          <li className="flex-1">
            <NavLink
              to="/login"
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center text-xs pt-1 transition text-slate-500 dark:text-gray-400',
                  isActive && 'text-yellow-500 dark:text-yellow-400'
                )
              }
            >
              <User className="w-6 h-6 mb-0.5" />
              <span className="text-[10px] leading-none">{t('nav_sign_in')}</span>
            </NavLink>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default BottomNavBar; 