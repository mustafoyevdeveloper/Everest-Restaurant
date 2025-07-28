import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAdminNotifications } from '@/context/AdminNotificationContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Calendar, 
  CreditCard, 
  MessageSquare, 
  LogOut, 
  Menu,
  X,
  Shield,
  UtensilsCrossed,
  Package,
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { apiFetch } from '@/lib/api';
import { getGlobalSocket, createSocketManager } from '@/lib/socket';
import { useTranslation } from 'react-i18next';

interface DashboardNotifications {
  total: number;
  orders: number;
  reservations: number;
  payments: number;
  messages: number;
  products: number;
}

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, updateUnreadCount } = useAdminNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dashboardNotifications, setDashboardNotifications] = useState<DashboardNotifications>({
    total: 0,
    orders: 0,
    reservations: 0,
    payments: 0,
    messages: 0,
    products: 0
  });
  const { t } = useTranslation();

  const navItems = [
    { 
      to: '/admin', 
      label: t('admin.sidebar.dashboard'), 
      icon: LayoutDashboard,
      notificationKey: 'total'
    },
    { 
      to: '/admin/products', 
      label: t('admin.sidebar.products'), 
      icon: Package,
      notificationKey: 'products'
    },
    { 
      to: '/admin/orders', 
      label: t('admin.sidebar.orders'), 
      icon: ShoppingCart,
      notificationKey: 'orders'
    },
    { 
      to: '/admin/reservations', 
      label: t('admin.sidebar.reservations'), 
      icon: Calendar,
      notificationKey: 'reservations'
    },
    { 
      to: '/admin/payments', 
      label: t('admin.sidebar.payments'), 
      icon: CreditCard,
      notificationKey: 'payments'
    },
    { 
      to: '/admin/messages', 
      label: t('admin.sidebar.messages'), 
      icon: MessageSquare,
      notificationKey: 'messages'
    },
  ];

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const data = await apiFetch('/admin/dashboard/notifications');
      setDashboardNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Clear notifications when visiting a section
  const clearNotifications = async (section: string) => {
    try {
      // Send request to backend to mark section as seen
      await apiFetch('/admin/dashboard/seen', {
        method: 'POST',
        body: JSON.stringify({ section })
      });
      
      // Update local state immediately for better UX
      setDashboardNotifications(prev => ({
        ...prev,
        [section]: 0,
        total: prev.total - prev[section as keyof DashboardNotifications]
      }));
    } catch (error) {
      console.error('Error marking section as seen:', error);
    }
  };

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (user?.role === 'admin') {
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
      } else {
        // Auth ma'lumotlarini yangilash
        socketManager.updateAuth({
          token: user.token,
          userId: user._id,
          role: user.role,
          name: user.name
        });
      }

      // Faqat ulanmagan bo'lsa connect qilamiz
      if (!socketManager.isConnected()) {
        socketManager.connect()
          .then((socket) => {
            console.log('✅ Admin layout socket connected');
            
            // Yangi rezervatsiya kelganda
            socketManager.on('new_reservation', (data) => {
              console.log('Yangi rezervatsiya keldi:', data);
              // Dashboard notification'larini yangilash
              fetchNotifications();
              // Contact notification'larini yangilash
              updateUnreadCount();
            });

            // Yangi buyurtma kelganda
            socketManager.on('new_order', (data) => {
              console.log('Yangi buyurtma keldi:', data);
              // Dashboard notification'larini yangilash
              fetchNotifications();
              // Contact notification'larini yangilash
              updateUnreadCount();
            });

            // Rezervatsiya bekor qilinganda
            socketManager.on('reservation_cancelled', (data) => {
              console.log('Rezervatsiya bekor qilindi:', data);
              fetchNotifications();
              updateUnreadCount();
            });

            // Buyurtma bekor qilinganda
            socketManager.on('order_cancelled', (data) => {
              console.log('Buyurtma bekor qilindi:', data);
              fetchNotifications();
              updateUnreadCount();
            });

            // To'lov qabul qilinganda
            socketManager.on('payment_received', (data) => {
              console.log('To\'lov qabul qilindi:', data);
              fetchNotifications();
              updateUnreadCount();
            });

            // Yangi xabar kelganda
            socketManager.on('new_contact_message', (data) => {
              console.log('Yangi xabar keldi:', data);
              fetchNotifications();
              updateUnreadCount();
            });

            // Yangi mahsulot qo'shilganda
            socketManager.on('new_product', (data) => {
              console.log('Yangi mahsulot qo\'shildi:', data);
              fetchNotifications();
            });

            // Mahsulot yangilanganda
            socketManager.on('product_updated', (data) => {
              console.log('Mahsulot yangilandi:', data);
              fetchNotifications();
            });

            // Mahsulot o'chirilganda
            socketManager.on('product_deleted', (data) => {
              console.log('Mahsulot o\'chirildi:', data);
              fetchNotifications();
            });

          })
          .catch((error) => {
            console.error('❌ Failed to connect admin layout socket:', error);
          });
      }

      // Initial fetch
      fetchNotifications();

      return () => {
        // Cleanup
      };
    }
  }, [user, updateUnreadCount]);

  // Clear notifications when visiting a section
  useEffect(() => {
    const currentPath = location.pathname;
    const currentSection = currentPath.split('/')[2]; // /admin/section -> section
    
    if (currentSection && dashboardNotifications[currentSection as keyof DashboardNotifications] > 0) {
      clearNotifications(currentSection);
    }
  }, [location.pathname, dashboardNotifications]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="w-4 h-4" />;
      case 'reservation':
        return <Calendar className="w-4 h-4" />;
      case 'payment':
        return <CreditCard className="w-4 h-4" />;
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'product':
        return <Package className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const formatNotificationDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Hozir';
    } else if (diffInHours < 24) {
      return `${diffInHours} soat oldin`;
    } else {
      return date.toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const groupNotificationsByDate = (notifications: any[]) => {
    const groups: { [key: string]: any[] } = {};
    
    notifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      const dateKey = date.toDateString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(notification);
    });
    
    return groups;
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await apiFetch(`/admin/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      // Refresh notifications
      updateUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const isHome = location.pathname === '/admin';

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('admin.access.denied')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('admin.access.description')}
          </p>
          <Button onClick={() => navigate('/login')}>
            {t('admin.access.backToLogin')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 admin-layout">
      {/* Main Navbar */}
      <Navbar />
      
      {/* Mobile hamburger button: Navbar pastida, o'ngda */}
      <div className="md:hidden flex justify-end w-full mt-2 px-2 fixed top-[66px] right-0 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg w-10 h-10 flex items-center justify-center"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Admin Sidebar */}
      <aside className={cn(
        "fixed top-[56px] left-0 z-40 w-64 h-[calc(100vh-56px)] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out admin-sidebar",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-3 md:p-4 border-b border-slate-200 dark:border-slate-700" style={{ paddingTop: 'calc(1rem + 20px)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
                <span className="font-semibold text-slate-800 dark:text-white text-sm md:text-base">
                  {t('admin.sidebar.title')}
                </span>
              </div>

              {/* Notification Bell */}
              <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{t('admin.notifications.title')}</h3>
                      {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={markAllAsRead}>
                          {t('admin.notifications.markAllRead')}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="p-2">
                        {Object.entries(groupNotificationsByDate(notifications.slice(0, 20))).map(([dateGroup, groupNotifications]) => (
                          <div key={dateGroup} className="mb-4">
                            <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-t">
                              {t(`admin.notifications.group.${dateGroup}`)}
                            </div>
                            {groupNotifications.map((notification) => (
                              <div
                                key={notification._id}
                                className={`p-3 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                  !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 mt-0.5">
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="font-medium text-sm">{notification.title}</p>
                                      <div className="flex items-center gap-1">
                                        {!notification.read && (
                                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteNotification(notification._id);
                                          }}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {formatNotificationDate(new Date(notification.createdAt))}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        {t('admin.notifications.noNew')}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 md:p-4" style={{ paddingTop: 'calc(1rem)' }}>
            <ul className="space-y-1 md:space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const notificationCount = dashboardNotifications[item.notificationKey as keyof DashboardNotifications];
                const isActive = location.pathname === item.to;
                return (
                  <li key={item.to} className="relative">
                    <Link
                      to={item.to}
                      className={cn(
                        "admin-nav-item transition-all duration-200 relative",
                        isActive
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : "text-slate-600 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="relative">
                        <Icon className={cn("admin-nav-icon", isActive && "text-yellow-500 dark:text-yellow-400")}/>
                        {notificationCount > 0 && (
                          <span className="admin-notification-badge">{notificationCount}</span>
                        )}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 md:p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="space-y-2">
              <Link
                to="/"
                className="flex items-center px-3 py-2 text-xs md:text-sm text-slate-600 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
              >
                <UtensilsCrossed className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                {t('admin.sidebar.backToSite')}
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-xs md:text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <LogOut className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                {t('admin.sidebar.logout')}
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="md:ml-64 pt-20 admin-content" style={{ marginBottom: 20 }}>
        <main
          className={
            `min-h-[calc(100vh-5rem)] md:pt-0 pt-0 ` +
            (!isHome ? ' pb-[75px] md:pt-0 md:pb-0' : '')
          }
          style={!isHome ? { paddingTop: 0, paddingBottom: 75 } : { paddingTop: 0 }}
        >
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <Footer />

      {/* Global Styles for Admin Pages */}
      <style>{`
        .admin-section {
          @apply space-y-6;
        }
        
        .admin-header {
          @apply flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4;
        }
        
        .admin-title {
          @apply text-2xl font-bold;
          background: linear-gradient(to right, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .admin-button {
          @apply flex items-center;
        }
        
        /* Admin Layout Styles */
        .admin-layout {
          @apply relative;
        }
        
        .admin-sidebar {
          @apply shadow-lg;
        }
        
        .admin-content {
          @apply transition-all duration-300;
        }
        
        .admin-nav-item {
          @apply flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200;
        }
        
        .admin-nav-icon {
          @apply w-4 h-4 mr-3;
        }
        
        .admin-notification-badge {
          @apply absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center;
        }
        
        /* Mobile responsive table */
        @media (max-width: 768px) {
          .admin-section table {
            @apply text-xs;
          }
          
          .admin-section th,
          .admin-section td {
            @apply px-2 py-2;
          }
          
          .admin-section .overflow-x-auto {
            @apply -mx-4;
          }
        }
        
        /* Mobile card layout for small screens */
        @media (max-width: 640px) {
          .admin-section .grid {
            @apply grid-cols-1;
          }
          
          .admin-section .space-y-4 {
            @apply space-y-3;
          }
          
          /* Mobile admin panel top spacing */
          .admin-content main {
            @apply pt-[150px];
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout; 