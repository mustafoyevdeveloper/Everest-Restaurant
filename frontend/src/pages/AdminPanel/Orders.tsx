import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Eye, Trash, Loader2, Package, Clock, CheckCircle, XCircle, Truck, Filter, History, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import StatusManager from '@/components/ui/StatusManager';
import { getAdminStatusText } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface OrderItem {
  _id: string;
  name: string;
  nameKey: string;
  quantity: number;
  price: number;
  product: {
    _id: string;
    name: string;
    image: string;
  };
}

interface ShippingAddress {
  fullName: string;
  email: string;
  district: string;
  region: string;
  postalCode: string;
  country: string;
}

interface StatusHistory {
  status: string;
  changedAt: string;
  changedBy: string;
  note: string;
}

interface Order {
  _id: string;
  orderCode?: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  orderType: 'delivery' | 'pickup';
  pickupDetails?: {
    reservationId: string;
    reservationCode: string;
    specialInstructions?: string;
  };
  paymentMethod: string;
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt: string;
  status: string;
  statusHistory: StatusHistory[];
  cancellationReason?: string;
  createdAt: string;
}

const AdminOrders: React.FC = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  const statusOptions = [
    { value: 'Pending', label: getAdminStatusText('Pending'), color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', icon: <Clock className="w-4 h-4" /> },
    { value: 'Confirmed', label: getAdminStatusText('Confirmed'), color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'Preparing', label: getAdminStatusText('Preparing'), color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400', icon: <Package className="w-4 h-4" /> },
    { value: 'Ready', label: getAdminStatusText('Ready'), color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'OutForDelivery', label: getAdminStatusText('OutForDelivery'), color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', icon: <Truck className="w-4 h-4" /> },
    { value: 'Delivered', label: getAdminStatusText('Delivered'), color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'Cancelled', label: getAdminStatusText('Cancelled'), color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: <XCircle className="w-4 h-4" /> }
  ];

  const [filters, setFilters] = useState({ 
    status: 'all', 
    paymentStatus: 'all',
    dateRange: 'all'
  });

  const formatCurrency = (value: number) => {
    return value.toLocaleString('uz-UZ', { style: 'currency', currency: 'UZS' });
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return (
      <Badge className={statusOption?.color || 'bg-gray-100 text-gray-800'}>
        {statusOption?.icon} {statusOption?.label || status}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-4 h-4" />;
      case 'Confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'Preparing':
        return <Package className="w-4 h-4" />;
      case 'Ready':
        return <CheckCircle className="w-4 h-4" />;
      case 'OutForDelivery':
        return <Truck className="w-4 h-4" />;
      case 'Delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'Cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Fetching orders...');
      const data = await apiFetch('/orders/admin');
      console.log('🔍 Orders response:', data);
      
      // Handle paginated response structure
      const ordersData = data.data?.docs || data.data || [];
      console.log('🔍 Orders data:', ordersData);
      setOrders(ordersData);
    } catch (err: any) {
      console.error('❌ Error fetching orders:', err);
      setError(err.message || 'Xatolik yuz berdi');
      toast({ title: 'Xato', description: err.message || 'Xatolik yuz berdi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: string, note?: string) => {
    setUpdatingStatus(orderId);
    try {
      await apiFetch(`/orders/admin/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus, note })
      });
      toast({ title: 'Muvaffaqiyatli', description: 'Status yangilandi' });
      fetchOrders(); // Refresh the list
    } catch (err: any) {
      toast({ title: 'Xato', description: err.message || 'Status yangilashda xatolik yuz berdi', variant: 'destructive' });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await apiFetch(`/orders/admin/${orderId}`, {
        method: 'DELETE'
      });
      toast({ title: 'Muvaffaqiyatli', description: 'Buyurtma o\'chirildi' });
      fetchOrders(); // Refresh the list
    } catch (err: any) {
      toast({ title: 'Xato', description: err.message || 'Buyurtma o\'chirishda xatolik yuz berdi', variant: 'destructive' });
    }
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter orders by search (orderCode or _id)
  const filteredOrders = orders.filter(order => {
    const searchValue = search.trim().toLowerCase();
    if (!searchValue) return true;
    return (
      (order.orderCode && order.orderCode.toLowerCase().includes(searchValue)) ||
      order._id.toLowerCase().includes(searchValue)
    );
  });

  return (
    <div className="admin-section p-4 md:p-6">
      <div className="admin-header">
        <h1 className="admin-title">{t('admin.orders.title', 'Buyurtmalar')}</h1>
        <Button variant="outline" size="sm" onClick={fetchOrders} className="admin-button">
          <RefreshCw className="w-4 h-4 mr-2" /> {t('admin.orders.refresh', 'Refresh')}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('admin.orders.search_by_id', 'ID orqali qidirish...')}
              className="w-full md:w-64 px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-slate-600 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-4">
          <Filter className="w-5 h-5" />
          <h3 className="font-semibold">{t('admin.orders.filters', 'Filtrlash')}</h3>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('admin.orders.status', 'Status')}</label>
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.orders.allStatuses', 'Barcha statuslar')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.orders.allStatuses', 'Barcha statuslar')}</SelectItem>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('admin.orders.paymentStatus', 'To\'lov holati')}</label>
            <Select value={filters.paymentStatus} onValueChange={(value) => setFilters(prev => ({ ...prev, paymentStatus: value }))}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.orders.allPayments', 'Barcha to\'lovlar')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.orders.allPayments', 'Barcha to\'lovlar')}</SelectItem>
                <SelectItem value="paid">{t('admin.orders.paid', 'To\'langan')}</SelectItem>
                <SelectItem value="unpaid">{t('admin_reservations_payment_unpaid_fixed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('admin.orders.date', 'Sana')}</label>
            <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.orders.allDays', 'Barcha kunlar')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.orders.allDays', 'Barcha kunlar')}</SelectItem>
                <SelectItem value="today">{t('admin.orders.today', 'Bugun')}</SelectItem>
                <SelectItem value="yesterday">{t('admin.orders.yesterday', 'Kecha')}</SelectItem>
                <SelectItem value="week">{t('admin.orders.lastWeek', 'Oxirgi 7 kun')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">{t('admin.orders.noOrders', 'Buyurtmalar topilmadi')}</div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.orders.order', 'Buyurtma')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.orders.customer', 'Mijoz')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.orders.products', 'Mahsulotlar')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.orders.price', 'Narx')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.orders.status', 'Status')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.orders.date', 'Sana')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.orders.actions', 'Amallar')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.orderCode || order._id.slice(-6)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        <Badge variant={order.orderType === 'delivery' ? 'default' : 'secondary'} className="text-xs">
                          {order.orderType === 'delivery' ? t('admin.orders.delivery', 'Yetkazib berish') : t('admin.orders.pickup', 'Restoranda olish')}
                        </Badge>
                        {order.orderType === 'pickup' && order.pickupDetails?.reservationCode && (
                          <div className="mt-1 text-xs font-mono text-blue-600">
                            {order.pickupDetails.reservationCode}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{order.shippingAddress.fullName}</div>
                      <div className="text-sm text-gray-500">{order.shippingAddress.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {order.orderItems.length} {t('admin.orders.productsCount', 'ta mahsulot')}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(order.totalPrice)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.isPaid ? t('admin_reservations_payment_paid') : t('admin_reservations_payment_unpaid_fixed')}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openOrderDetails(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {order.status !== 'Cancelled' && (
                          <StatusManager
                            currentStatus={order.status}
                            statusOptions={statusOptions}
                            onStatusChange={(newStatus, note) => handleStatusUpdate(order._id, newStatus, note)}
                            isLoading={updatingStatus === order._id}
                          />
                        )}
                        
                        {order.status === 'Cancelled' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteOrder(order._id)}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white dark:bg-slate-800 rounded-lg border p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {order.orderCode || order._id.slice(-6)}
                    </h3>
                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(order.status)}
                    <div className={`w-2 h-2 rounded-full ${
                      order.isPaid ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    {order.shippingAddress.fullName}
                  </h4>
                  <p className="text-sm text-gray-500">{order.shippingAddress.email}</p>
                  <p className="text-sm text-gray-500">
                    {order.shippingAddress.district}, {order.shippingAddress.region}
                  </p>
                </div>

                {/* Order Summary */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.orderItems.length} {t('admin.orders.productsCount', 'ta mahsulot')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.isPaid ? t('admin_reservations_payment_paid') : t('admin_reservations_payment_unpaid_fixed')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(order.totalPrice)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-slate-700">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openOrderDetails(order)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    {order.status !== 'Cancelled' && (
                      <StatusManager
                        currentStatus={order.status}
                        statusOptions={statusOptions}
                        onStatusChange={(newStatus, note) => handleStatusUpdate(order._id, newStatus, note)}
                        isLoading={updatingStatus === order._id}
                      />
                    )}
                  </div>
                  
                  {order.status === 'Cancelled' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteOrder(order._id)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.orders.orderDetails', 'Buyurtma tafsilotlari')}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">{t('admin.orders.orderInfo', 'Buyurtma ma\'lumotlari')}</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>ID:</strong> {selectedOrder.orderCode || selectedOrder._id.slice(-6)}</p>
                    <p><strong>{t('admin.orders.status', 'Status')}:</strong> {getStatusBadge(selectedOrder.status)}</p>
                    <p><strong>{t('admin.orders.date', 'Sana')}:</strong> {formatDate(selectedOrder.createdAt)}</p>
                    <p><strong>{t('admin.orders.payment', 'To\'lov')}:</strong> {selectedOrder.isPaid ? t('admin_reservations_payment_paid') : t('admin_reservations_payment_unpaid_fixed')}</p>
                    {selectedOrder.cancellationReason && (
                      <p><strong>{t('admin.orders.cancellationReason', 'Bekor qilish sababi')}:</strong> {
                        selectedOrder.cancellationReason === 'Cancelled by user' 
                          ? t('admin_reservations_cancellation_reason_cancelled_by_user')
                          : selectedOrder.cancellationReason
                      }</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{t('admin.orders.customerInfo', 'Mijoz ma\'lumotlari')}</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>{t('admin.orders.name', 'Ism')}:</strong> {selectedOrder.shippingAddress.fullName}</p>
                    <p><strong>Email:</strong> {selectedOrder.shippingAddress.email}</p>
                    <p><strong>{t('admin.orders.address', 'Manzil')}:</strong> {selectedOrder.shippingAddress.district}, {selectedOrder.shippingAddress.region}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-2">{t('admin.orders.products', 'Mahsulotlar')}</h3>
                <div className="space-y-2">
                  {selectedOrder.orderItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700 rounded">
                      <div>
                        <p className="font-medium">{item.name || item.nameKey}</p>
                        <p className="text-sm text-gray-500">{t('admin.orders.quantity', 'Miqdori')}: {item.quantity}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Summary */}
              <div>
                <h3 className="font-semibold mb-2">{t('admin.orders.priceSummary', 'Narx hisobi')}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>{t('admin.orders.products', 'Mahsulotlar')}:</span>
                    <span>{formatCurrency(selectedOrder.itemsPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin.orders.shipping', 'Yetkazib berish')}:</span>
                    <span>{formatCurrency(selectedOrder.shippingPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin.orders.tax', 'Soliq')}:</span>
                    <span>{formatCurrency(selectedOrder.taxPrice)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>{t('admin.orders.total', 'Jami')}:</span>
                    <span>{formatCurrency(selectedOrder.totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Status History */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center">
                    <History className="w-4 h-4 mr-2" />
                    {t('admin.orders.statusHistory', 'Status tarixi')}
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.statusHistory.slice().reverse().map((history, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-slate-700 rounded">
                        {getStatusIcon(history.status)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{getAdminStatusText(history.status)}</p>
                          <p className="text-xs text-gray-500">{history.note}</p>
                          <p className="text-xs text-gray-400">
                            {formatDate(history.changedAt)} - {history.changedBy}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders; 