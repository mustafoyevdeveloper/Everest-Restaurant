import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Eye, Trash, Loader2, DollarSign, CreditCard, CheckCircle, XCircle, Clock, Filter, RefreshCw, Calendar, User, History } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getAdminStatusText } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface CardInfo {
  cardNumber: string;
  cardType: string;
  cardBrand: string;
  maskedNumber: string;
}

interface TransactionDetails {
  paycomId: string;
  paycomTime: string;
  createTime: string;
  performTime: string;
  cancelTime?: string;
  cancelReason?: string;
  receivers: Array<{ id: string; amount: number }>;
}

interface PaymentMetadata {
  ipAddress: string;
  userAgent: string;
  deviceInfo: string;
  location: string;
  timezone: string;
}

interface StatusHistory {
  status: string;
  changedAt: string;
  reason: string;
  note: string;
}

interface Payment {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  order?: {
    _id: string;
    orderItems: Array<{ name: string; quantity: number; price: number }>;
    totalPrice: number;
  };
  reservation?: {
    _id: string;
    name: string;
    date: string;
    time: string;
    guests: number;
    totalPrice: number;
  };
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  paymentUrl: string;
  orderId: string;
  transactionId?: string;
  description: string;
  cardInfo?: CardInfo;
  transactionDetails?: TransactionDetails;
  metadata?: PaymentMetadata;
  statusHistory?: StatusHistory[];
  completedAt?: string;
  createdAt: string;
}

interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
}

const AdminPayments: React.FC = () => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [filters, setFilters] = useState({ 
    status: 'all', 
    paymentMethod: 'all',
    type: 'all'
  });
  const { toast } = useToast();

  // Backend model bilan mos keladigan status options
  const statusOptions = [
    { value: 'all', label: t('admin.payments.allStatuses') },
    { value: 'pending', label: getAdminStatusText('pending'), color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', icon: <Clock className="w-4 h-4" /> },
    { value: 'completed', label: getAdminStatusText('completed'), color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'failed', label: getAdminStatusText('failed'), color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: <XCircle className="w-4 h-4" /> },
    { value: 'cancelled', label: getAdminStatusText('cancelled'), color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', icon: <XCircle className="w-4 h-4" /> },
  ];

  const methodOptions = [
    { value: 'all', label: t('admin.payments.allMethods', 'Barcha usullar') },
    { value: 'Payme', label: 'Payme' },
  ];

  const typeOptions = [
    { value: 'all', label: t('admin.payments.allTypes', 'Barcha turi') },
    { value: 'order', label: t('admin.payments.order', 'Buyurtma') },
    { value: 'reservation', label: t('admin.payments.reservation', 'Rezervatsiya') },
  ];

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    if (statusOption) {
      return (
        <Badge className={statusOption.color}>
          {statusOption.icon} {statusOption.label}
        </Badge>
      );
    }
    
    // Fallback for unknown statuses
    const fallbackConfig = {
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      icon: <CreditCard className="w-4 h-4" />
    };
    
    return (
      <Badge className={fallbackConfig.color}>
        {fallbackConfig.icon} {getAdminStatusText(status)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-4 h-4" />;
      case 'Completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'Failed':
        return <XCircle className="w-4 h-4" />;
      case 'Cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'Payme':
        return '💳';
      default:
        return '💰';
    }
  };

  const formatPaymentId = (orderId: string) => {
    // If it's already in the new format (RES/ORD), return as is
    if (orderId.startsWith('RES') || orderId.startsWith('ORD')) {
      return orderId;
    }
    // If it's the old format (res_/order_), convert to new format
    if (orderId.startsWith('res_')) {
      return `RES${orderId.slice(4, 12).toUpperCase()}`;
    }
    if (orderId.startsWith('order_')) {
      return `ORD${orderId.slice(6, 14).toUpperCase()}`;
    }
    // For any other format, show last 8 characters
    return orderId.slice(-8).toUpperCase();
  };

  const getPaymentType = (payment: Payment) => {
    if (payment.order) return t('admin.payments.order', 'Buyurtma');
    if (payment.reservation) return t('admin.payments.reservation', 'Rezervatsiya');
    return t('admin.payments.unknown', 'Noma\'lum');
  };

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Fetching payments...');
      const data = await apiFetch('/payments/admin');
      console.log('🔍 Payments response:', data);
      
      const paymentsData = data.data?.docs || data.data || [];
      console.log('🔍 Payments data:', paymentsData);
      console.log('🔍 Payment statuses found:', [...new Set(paymentsData.map(p => p.status))]);
      setPayments(paymentsData);
    } catch (err: any) {
      console.error('❌ Error fetching payments:', err);
      setError(err.message || 'Xatolik yuz berdi');
      toast({ title: 'Xato', description: err.message || 'Xatolik yuz berdi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiFetch('/admin/payments/stats');
      setStats(data.data);
    } catch (err: any) {
      console.error('To\'lovlar statistikasi yuklashda xato yuz berdi:', err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStats();
    // eslint-disable-next-line
  }, []);

  const handleMarkAsRead = async (paymentIds: string[]) => {
    try {
      await apiFetch('/admin/payments/notifications/mark-read', {
        method: 'PUT',
        body: JSON.stringify({ paymentIds })
      });
      toast({ title: 'Muvaffaqiyatli', description: 'To\'lovlar o\'qildi' });
      fetchPayments(); // Refresh the list
    } catch (err: any) {
      toast({ title: 'Xato', description: err.message || 'To\'lovlar o\'qishda xato yuz berdi', variant: 'destructive' });
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      await apiFetch(`/admin/payments/${paymentId}`, {
        method: 'DELETE'
      });
      toast({ title: 'Muvaffaqiyatli', description: 'To\'lov o\'chirildi' });
      fetchPayments(); // Refresh the list
    } catch (err: any) {
      toast({ title: 'Xato', description: err.message || 'To\'lov o\'chirishda xato yuz berdi', variant: 'destructive' });
    }
  };

  const openPaymentDetails = (payment: Payment) => {
    setSelectedPayment(payment);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS'
    }).format(amount);
  };

  const filteredPayments = payments.filter(payment => {
    // console.log('🔍 Filtering payment:', payment.status, 'against filter:', filters.status);
    
    if (filters.status !== 'all' && payment.status !== filters.status) {
      // console.log('❌ Status filter failed:', payment.status, '!==', filters.status);
      return false;
    }
    
    if (filters.paymentMethod !== 'all' && payment.paymentMethod !== filters.paymentMethod) {
      // console.log('❌ Payment method filter failed:', payment.paymentMethod, '!==', filters.paymentMethod);
      return false;
    }
    
    if (filters.type !== 'all') {
      const paymentType = getPaymentType(payment);
      if (filters.type === 'order' && paymentType !== t('admin.payments.order', 'Buyurtma')) return false;
      if (filters.type === 'reservation' && paymentType !== t('admin.payments.reservation', 'Rezervatsiya')) return false;
    }
    
    // console.log('✅ Payment passed all filters');
    return true;
  });

  // console.log('🔍 Filtered payments count:', filteredPayments.length);

  return (
    <div className="admin-section p-4 md:p-6">
      <div className="admin-header">
        <h1 className="admin-title !text-black dark:!text-white">{t('admin.payments.title', 'To\'lovlar')}</h1>
          <Button variant="outline" size="sm" onClick={fetchPayments} className="admin-button">
          <RefreshCw className="w-4 h-4 mr-2" /> {t('admin.payments.refresh', 'Refresh')}
          </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="admin-stats-grid">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('admin.payments.totalPayments', 'Umumiy to\'lovlar')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.totalPayments}</p>
              </div>
              <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('admin.payments.totalAmount', 'Umumiy summa')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.totalAmount?.toLocaleString()} so'm</p>
              </div>
              <CreditCard className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('admin.payments.completed', 'To\'langan')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.completedPayments}</p>
              </div>
              <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('admin.payments.failed', 'Xatolik')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.failedPayments}</p>
              </div>
              <XCircle className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="w-5 h-5" />
          <h3 className="font-semibold">{t('admin.payments.filters', 'Filtrlash')}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('admin.payments.status', 'Status')}</label>
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.payments.allStatuses', 'Barcha statuslar')} />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('admin.payments.paymentMethod', 'To\'lov usuli')}</label>
            <Select value={filters.paymentMethod} onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value }))}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.payments.allMethods', 'Barcha usullar')} />
              </SelectTrigger>
              <SelectContent>
                {methodOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('admin.payments.type', 'Turi')}</label>
            <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.payments.allTypes', 'Barcha turlar')} />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">{t('admin.payments.noPayments', 'To\'lovlar topilmadi')}</div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.payments.paymentId', 'To\'lov ID')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.payments.customer', 'Mijoz')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.payments.type', 'Turi')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.payments.amount', 'Summa')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.payments.status', 'Status')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.payments.date', 'Sana')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.payments.actions', 'Amallar')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {filteredPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatPaymentId(payment.orderId)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{payment.user?.name || '-'}</div>
                      <div className="text-sm text-gray-500">{payment.user?.email || '-'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {getPaymentType(payment)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(payment.amount)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPaymentDetails(payment)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('admin.payments.deletePayment', 'To\'lovni o\'chirish')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('admin.payments.deleteConfirm', 'Bu to\'lovni o\'chirishni xohlaysizmi? Bu amalni qaytarib bo\'lmaydi.')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('admin.payments.cancel', 'Bekor qilish')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePayment(payment._id)}>
                                {t('admin.payments.delete', 'O\'chirish')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.payments.paymentDetails', 'To\'lov tafsilotlari')}</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6">
              {/* Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">{t('admin.payments.paymentInfo', 'To\'lov ma\'lumotlari')}</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>ID:</strong> {formatPaymentId(selectedPayment.orderId)}</p>
                    <p><strong>{t('admin.payments.status', 'Status')}:</strong> {getStatusBadge(selectedPayment.status)}</p>
                    <p><strong>{t('admin.payments.amount', 'Summa')}:</strong> {formatCurrency(selectedPayment.amount)}</p>
                    <p><strong>{t('admin.payments.method', 'Usul')}:</strong> {selectedPayment.paymentMethod}</p>
                    <p><strong>{t('admin.payments.date', 'Sana')}:</strong> {formatDate(selectedPayment.createdAt)}</p>
                    {selectedPayment.completedAt && (
                      <p><strong>{t('admin.payments.completedAt', 'Bajarilgan')}:</strong> {formatDate(selectedPayment.completedAt)}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{t('admin.payments.customerInfo', 'Mijoz ma\'lumotlari')}</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>{t('admin.payments.name', 'Ism')}:</strong> {selectedPayment.user.name}</p>
                    <p><strong>Email:</strong> {selectedPayment.user.email}</p>
                  </div>
                </div>
              </div>

              {/* Order/Reservation Info */}
              {selectedPayment.order && (
                <div>
                  <h3 className="font-semibold mb-2">{t('admin.payments.orderInfo', 'Buyurtma ma\'lumotlari')}</h3>
                  <div className="space-y-2">
                    {selectedPayment.order.orderItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700 rounded">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">{t('admin.payments.quantity', 'Miqdori')}: {item.quantity}</p>
                        </div>
                        <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>{t('admin.payments.total', 'Jami')}:</span>
                      <span>{formatCurrency(selectedPayment.order.totalPrice)}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedPayment.reservation && (
                <div>
                  <h3 className="font-semibold mb-2">{t('admin.payments.reservationInfo', 'Rezervatsiya ma\'lumotlari')}</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>{t('admin.payments.name', 'Ism')}:</strong> {selectedPayment.reservation.name}</p>
                    <p><strong>{t('admin.payments.date', 'Sana')}:</strong> {formatDate(selectedPayment.reservation.date)}</p>
                    <p><strong>{t('admin.payments.time', 'Vaqt')}:</strong> {selectedPayment.reservation.time}</p>
                    <p><strong>{t('admin.payments.guests', 'Mehmonlar')}:</strong> {selectedPayment.reservation.guests}</p>
                    <p><strong>{t('admin.payments.total', 'Jami')}:</strong> {formatCurrency(selectedPayment.reservation.totalPrice)}</p>
                  </div>
                </div>
              )}

              {/* Status History */}
              {selectedPayment.statusHistory && selectedPayment.statusHistory.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center">
                    <History className="w-4 h-4 mr-2" />
                    {t('admin.payments.statusHistory', 'Status tarixi')}
                  </h3>
                  <div className="space-y-2">
                    {selectedPayment.statusHistory.slice().reverse().map((history, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-slate-700 rounded">
                        {getStatusIcon(history.status)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{getAdminStatusText(history.status)}</p>
                          <p className="text-xs text-gray-500">{history.note}</p>
                          <p className="text-xs text-gray-400">
                            {formatDate(history.changedAt)} - {history.reason}
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

export default AdminPayments; 