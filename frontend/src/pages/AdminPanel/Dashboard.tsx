import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  CreditCard, 
  Package, 
  TrendingDown, 
  Users, 
  Calendar,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { useAdminNotifications } from '@/context/AdminNotificationContext';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, getAdminStatusText } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  thisMonthOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  thisMonthRevenue: number;
  monthOrders?: number;
  lastMonthOrders?: number;
  monthRevenue?: number;
  lastMonthRevenue?: number;
  monthReservations?: number;
  lastMonthReservations?: number;
  ordersMoM?: number;
  revenueMoM?: number;
  reservationsMoM?: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalReservations: number;
  todayReservations: number;
  confirmedReservations: number;
  cancelledReservations: number;
  totalUsers: number;
  newUsers: number;
  unreadMessages: number;
  recentOrders: any[];
  recentReservations: any[];
  recentCancellations: any[];
  statusBreakdown: {
    orders: { [key: string]: number };
    reservations: { [key: string]: number };
  };
}

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useAdminNotifications();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const apiRes = await apiFetch('/admin/dashboard/stats');
      const data = apiRes?.data ?? apiRes; // Backend returns { success, data }

      // Calculate totals safely
      const reservationStatuses = data?.reservationStatuses || {};
      const totalReservations = Object.values(reservationStatuses).reduce(
        (sum: number, val: any) => sum + (typeof val === 'number' ? val : 0),
        0
      );

      // Transform backend data to match frontend interface
      const transformedStats = {
        totalOrders: data?.totalOrders || 0,
        todayOrders: data?.todayOrders || 0,
        thisMonthOrders: data?.monthOrders || 0,
        monthOrders: data?.monthOrders,
        lastMonthOrders: data?.lastMonthOrders,
        totalRevenue: data?.totalRevenue || 0,
        todayRevenue: data?.todayRevenue || 0,
        thisMonthRevenue: data?.monthRevenue || 0,
        monthRevenue: data?.monthRevenue,
        lastMonthRevenue: data?.lastMonthRevenue,
        ordersMoM: data?.ordersMoM,
        revenueMoM: data?.revenueMoM,
        pendingOrders: data?.orderStatuses?.Pending || 0,
        deliveredOrders: data?.orderStatuses?.Delivered || 0,
        cancelledOrders: data?.orderStatuses?.Cancelled || 0,
        totalReservations: data?.totalReservations ?? totalReservations,
        todayReservations: data?.todayReservations || 0,
        monthReservations: data?.monthReservations,
        lastMonthReservations: data?.lastMonthReservations,
        reservationsMoM: data?.reservationsMoM,
        confirmedReservations: data?.confirmedReservations ?? (reservationStatuses?.Confirmed || 0),
        cancelledReservations: data?.cancelledReservations ?? (reservationStatuses?.Cancelled || 0),
        totalUsers: data?.totalUsers || 0,
        newUsers: data?.newUsers || 0,
        unreadMessages: data?.unreadMessages || 0,
        recentOrders: data?.recentOrders || [],
        recentReservations: data?.recentReservations || [],
        recentCancellations: [], // Optional: compute if needed
        statusBreakdown: {
          orders: data?.orderStatuses || {},
          reservations: reservationStatuses
        }
      };

      setStats(transformedStats);
    } catch (err: any) {
      console.error('Dashboard stats error:', err);
      setError(err.message || t('admin.dashboard.statsError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Package className="w-4 h-4" />;
      case 'Confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'Delivered': return <CheckCircle className="w-4 h-4" />;
      case 'Cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">{t('admin.dashboard.statsLoading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={fetchStats} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('admin.dashboard.retry')}
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="admin-section p-4 md:p-6 space-y-6">
      <div className="admin-header">
        <h1 className="admin-title">{t('admin.dashboard.title')}</h1>
        <Button variant="outline" size="sm" onClick={fetchStats} className="admin-button">
          <RefreshCw className="w-4 h-4 mr-2" /> {t('admin.dashboard.refresh', 'Refresh')}
        </Button>
      </div>
      
      {/* Main Stats Cards */}
      <div className="admin-stats-grid">
        <Card className="admin-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.dashboard.totalOrders')}</CardTitle>
            <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.totalOrders}</div>
            <div className="text-xs text-muted-foreground">{t('admin.dashboard.today')}: {stats.todayOrders}</div>
            <div className="text-xs text-muted-foreground">
              {t('admin.dashboard.thisMonth')}: {stats.thisMonthOrders}
              {typeof stats.ordersMoM === 'number' && (
                <span className={`ml-2 ${stats.ordersMoM >= 0 ? 'text-green-600' : 'text-red-500'}`}>({stats.ordersMoM}%)</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="admin-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.dashboard.totalRevenue')}</CardTitle>
            <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <div className="text-xs text-muted-foreground">{t('admin.dashboard.today')}: {formatCurrency(stats.todayRevenue)}</div>
            <div className="text-xs text-muted-foreground">
              {t('admin.dashboard.thisMonth')}: {formatCurrency(stats.thisMonthRevenue)}
              {typeof stats.revenueMoM === 'number' && (
                <span className={`ml-2 ${stats.revenueMoM >= 0 ? 'text-green-600' : 'text-red-500'}`}>({stats.revenueMoM}%)</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="admin-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.dashboard.reservations')}</CardTitle>
            <Calendar className="w-5 h-5 md:w-6 md:h-6 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.totalReservations}</div>
            <div className="text-xs text-muted-foreground">{t('admin.dashboard.today')}: {stats.todayReservations}</div>
            <div className="text-xs text-muted-foreground">
              {t('admin.dashboard.thisMonth')}: {stats.monthReservations || 0}
              {typeof stats.reservationsMoM === 'number' && (
                <span className={`ml-2 ${stats.reservationsMoM >= 0 ? 'text-green-600' : 'text-red-500'}`}>({stats.reservationsMoM}%)</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">{t('admin.dashboard.confirmed')}: {stats.confirmedReservations}</div>
          </CardContent>
        </Card>

        <Card className="admin-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.dashboard.users')}</CardTitle>
            <Users className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.totalUsers}</div>
            <div className="text-xs text-muted-foreground">{t('admin.dashboard.new')}: {stats.newUsers}</div>
            <div className="text-xs text-muted-foreground">{t('admin.dashboard.messages')}: {stats.unreadMessages}</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="admin-card">
          <CardHeader>
            <CardTitle className="text-lg">{t('admin.dashboard.orderStatus')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('admin.dashboard.pending')}</span>
              <span className="text-sm font-semibold">
                {stats.statusBreakdown.orders.Pending || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('admin.dashboard.delivered')}</span>
              <span className="text-sm font-semibold">
                {stats.statusBreakdown.orders.Delivered || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('admin.dashboard.cancelled')}</span>
              <span className="text-sm font-semibold">
                {stats.statusBreakdown.orders.Cancelled || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="admin-card">
          <CardHeader>
            <CardTitle className="text-lg">{t('admin.dashboard.reservationStatus')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('admin.dashboard.confirmed')}</span>
              <span className="text-sm font-semibold">
                {stats.statusBreakdown.reservations.Confirmed || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('admin.dashboard.cancelled')}</span>
              <span className="text-sm font-semibold">
                {stats.statusBreakdown.reservations.Cancelled || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('admin.dashboard.total')}</span>
              <span className="text-sm font-semibold">
                {Object.values(stats.statusBreakdown.reservations).reduce((a: number, b: number) => a + b, 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        {stats.recentOrders && stats.recentOrders.length > 0 && (
          <Card className="admin-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                {t('admin.dashboard.recentOrders')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentOrders.slice(0, 5).map((order: any) => (
                  <div key={order._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex-1">
                      <div className="font-medium text-sm">#{order._id.slice(-6)}</div>
                      <div className="text-xs text-gray-500">{order.user?.name || t('admin.dashboard.unknown')}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">{formatCurrency(order.totalPrice)}</div>
                      <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {getAdminStatusText(order.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Cancellations */}
        {stats.recentCancellations && stats.recentCancellations.length > 0 && (
          <Card className="admin-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                {t('admin.dashboard.recentCancellations')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentCancellations.slice(0, 5).map((item: any) => (
                  <div key={item._id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50 dark:bg-red-900/10">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {item.type === 'order' ? t('admin.orders.order') : t('admin.reservations.reservation')} #{item._id.slice(-6)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-red-600 dark:text-red-400">
                        {item.user?.name || t('admin.dashboard.customer')} {t('admin.dashboard.by')}
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {t('admin.dashboard.cancelled')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Card className="admin-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {t('admin.dashboard.recentMessages')}
              </span>
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                {t('admin.notifications.markAllRead')}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notification) => (
                <div 
                  key={notification.id} 
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{notification.title}</div>
                    <div className="text-xs text-gray-500">{notification.message}</div>
                    <div className="text-xs text-gray-400">
                      {notification.timestamp.toLocaleString()}
                    </div>
                  </div>
                  {!notification.read && (
                    <Badge variant="secondary" className="text-xs">
                      {t('admin.dashboard.new')}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard; 