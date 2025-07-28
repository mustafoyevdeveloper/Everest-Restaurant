import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { createSocketManager, getSocketManager, disconnectSocketManager } from '@/lib/socket';
import { apiFetch } from '@/lib/api';

interface Notification {
  id: string;
  type: 'order_cancelled' | 'reservation_cancelled' | 'new_order' | 'new_reservation' | 'payment_received' | 'contact_message';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  read: boolean;
}

interface AdminNotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  unreadContactCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  fetchNotifications: () => Promise<void>;
  updateUnreadCount: () => void;
}

const AdminNotificationContext = createContext<AdminNotificationContextType | undefined>(undefined);

export const useAdminNotifications = () => {
  const context = useContext(AdminNotificationContext);
  if (!context) {
    throw new Error('useAdminNotifications must be used within AdminNotificationProvider');
  }
  return context;
};

interface AdminNotificationProviderProps {
  children: ReactNode;
}

export const AdminNotificationProvider: React.FC<AdminNotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState<any>(null);
  const { user } = useAuth();

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const updateUnreadCount = async () => {
    try {
      const response = await apiFetch('/admin/notifications/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const formatId = (id: string) => {
    return id.slice(-6).toUpperCase();
  };

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (user?.role === 'admin' && user?.token) {
      const socketManager = createSocketManager({
        url: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
        auth: {
          token: user.token,
          userId: user._id,
          role: user.role,
          name: user.name
        }
      });

      socketManager.connect()
        .then((socket) => {
          setSocket(socket);
          console.log('✅ Admin notification socket connected');

          // Listen for various notification events
          socketManager.on('order_cancelled', (data) => {
            addNotification({
              type: 'order_cancelled',
              title: 'Buyurtma bekor qilindi',
              message: `Buyurtma #${formatId(data.orderId)} mijoz tomonidan bekor qilindi`,
              data: data,
            });
          });

          socketManager.on('reservation_cancelled', (data) => {
            addNotification({
              type: 'reservation_cancelled',
              title: 'Rezervatsiya bekor qilindi',
              message: `Rezervatsiya #${formatId(data.reservationId)} mijoz tomonidan bekor qilindi`,
              data: data,
            });
          });

          socketManager.on('new_order', (data) => {
            addNotification({
              type: 'new_order',
              title: 'Yangi buyurtma',
              message: `Yangi buyurtma #${formatId(data.orderId)} qabul qilindi`,
              data: data,
            });
          });

          socketManager.on('new_reservation', (data) => {
            addNotification({
              type: 'new_reservation',
              title: 'Yangi rezervatsiya',
              message: `Rezervatsiya #${formatId(data.reservationId)} qabul qilindi`,
              data: data,
            });
          });

          socketManager.on('payment_received', (data) => {
            addNotification({
              type: 'payment_received',
              title: 'To\'lov qabul qilindi',
              message: `${data.amount.toLocaleString()} so'm to'lov qabul qilindi`,
              data: data,
            });
          });

          socketManager.on('contact_message', (data) => {
            addNotification({
              type: 'contact_message',
              title: 'Yangi xabar',
              message: `${data.name} dan yangi xabar`,
              data: data,
            });
            updateUnreadCount(); // Update unread count when new message arrives
          });

          // Initial unread count fetch
          updateUnreadCount();
        })
        .catch((error) => {
          console.error('❌ Failed to connect admin notification socket:', error);
        });

      return () => {
        disconnectSocketManager();
        setSocket(null);
      };
    }
  }, [user]);

  const value: AdminNotificationContextType = {
    notifications,
    unreadCount,
    unreadContactCount: 0,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    addNotification,
    fetchNotifications: async () => {
      // Implementation needed
    },
    updateUnreadCount,
  };

  return (
    <AdminNotificationContext.Provider value={value}>
      {children}
    </AdminNotificationContext.Provider>
  );
}; 