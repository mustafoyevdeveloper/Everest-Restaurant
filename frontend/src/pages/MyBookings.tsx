import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { formatCurrency, getStatusText } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

// Interfaces
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderCode?: string;
  orderItems: OrderItem[];
  totalPrice: number;
  total?: number; // Keep optional for backward compatibility
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string;
}

interface Reservation {
  _id: string;
  date: string;
  time: string;
  guests: number;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  createdAt: string;
}

const MyBookings = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const fetchData = async () => {
    setDataLoading(true);
    try {
      const [ordersData, reservationsData] = await Promise.all([
        apiFetch('/orders/myorders'),
        apiFetch('/reservations/myreservations'),
      ]);
      setOrders(ordersData || []);
      setReservations(reservationsData || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch your bookings.", variant: "destructive" });
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleCancelOrder = async (id: string) => {
    try {
      const currentLanguage = localStorage.getItem('language') || 'en';
      await apiFetch(`/orders/${id}/cancel`, { 
        method: 'PUT',
        body: JSON.stringify({ language: currentLanguage })
      });
      toast({ title: t('toast_success'), description: t('mybookings_cancel_order_success') });
      fetchData(); // Refresh data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('mybookings_cancel_order_fail');
      toast({ title: t('toast_error'), description: errorMessage, variant: "destructive" });
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      await apiFetch(`/orders/${id}`, { method: 'DELETE' });
      toast({ title: t('toast_success'), description: t('mybookings_delete_order_success') });
      fetchData(); // Refresh data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('mybookings_delete_order_fail');
      toast({ title: t('toast_error'), description: errorMessage, variant: "destructive" });
    }
  };

  const handleCancelReservation = async (id: string) => {
    try {
      const currentLanguage = localStorage.getItem('language') || 'en';
      await apiFetch(`/reservations/${id}/cancel`, { 
        method: 'PUT',
        body: JSON.stringify({ language: currentLanguage })
      });
      toast({ title: t('toast_success'), description: t('mybookings_cancel_reservation_success') });
      fetchData(); // Refresh data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('mybookings_cancel_reservation_fail');
      toast({ title: t('toast_error'), description: errorMessage, variant: "destructive" });
    }
  };

  const handleDeleteReservation = async (id: string) => {
    try {
      await apiFetch(`/reservations/${id}`, { method: 'DELETE' });
      toast({ title: t('toast_success'), description: t('mybookings_delete_reservation_success') });
      fetchData(); // Refresh data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('mybookings_delete_reservation_fail');
      toast({ title: t('toast_error'), description: errorMessage, variant: "destructive" });
    }
  };
  
  if (loading) return <div>Yuklanmoqda...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <div className="pt-24 md:pt-32 pb-8 md:pb-12 bg-white dark:bg-slate-900 text-center">
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-slate-800 dark:gradient-text mb-2 md:mb-4">{t('mybookings_title')}</h1>
        <p className="text-sm md:text-xl text-slate-600 dark:text-gray-400 px-2">{t('mybookings_subtitle')}</p>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pb-16 md:pb-24">
        <Tabs defaultValue="orders">
          <TabsList className="grid w-full grid-cols-2 h-10 md:h-12">
            <TabsTrigger value="orders" className="text-xs md:text-sm">{t('mybookings_orders_tab')}</TabsTrigger>
            <TabsTrigger value="reservations" className="text-xs md:text-sm">{t('mybookings_reservations_tab')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders" className="mt-4 md:mt-6">
            <Card className="dark:bg-slate-800 shadow-sm">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-lg md:text-xl">{t('mybookings_your_orders_title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                {dataLoading ? <p className="text-sm md:text-base">{t('loading_orders')}</p> : orders.length > 0 ? orders.map(order => (
                  <div key={order._id} className="p-3 md:p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm md:text-base mb-2"><strong>{t('mybookings_order_id')}:</strong> {order.orderCode || order._id.substring(0, 7)}</p>
                        <div className="space-y-1 md:space-y-2 text-xs md:text-sm">
                          {order.orderItems.map((item, index) => (
                            <div key={index} className="flex justify-between">
                              <span className="truncate flex-1 mr-2">{item.name} x {item.quantity}</span>
                              <span className="flex-shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <hr className="my-2" />
                        <div className="space-y-1 text-xs md:text-sm">
                          <p><strong>{t('mybookings_total')}:</strong> {formatCurrency(order.totalPrice || order.total || 0)}</p>
                          <p><strong>{t('mybookings_status')}:</strong> {getStatusText(order.status)}</p>
                          <p><strong>{t('mybookings_date')}:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Badge className="mt-2 text-xs">{getStatusText(order.status)}</Badge>
                      </div>
                      {order.status === 'Pending' && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="h-8 md:h-10 text-xs md:text-sm w-full md:w-auto"
                          onClick={() => handleCancelOrder(order._id)}
                        >
                          {t('mybookings_cancel_order_btn')}
                        </Button>
                      )}
                      {order.status === 'Cancelled' && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="h-8 md:h-10 text-xs md:text-sm w-full md:w-auto"
                          onClick={() => handleDeleteOrder(order._id)}
                        >
                          {t('mybookings_delete_order_btn')}
                        </Button>
                      )}
                    </div>
                  </div>
                )) : <p className="text-sm md:text-base">{t('mybookings_no_orders')}</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reservations" className="mt-4 md:mt-6">
            <Card className="dark:bg-slate-800 shadow-sm">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-lg md:text-xl">{t('mybookings_your_reservations_title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                {dataLoading ? <p className="text-sm md:text-base">{t('loading_reservations')}</p> : reservations.length > 0 ? reservations.map(res => (
                  <div key={res._id} className="p-3 md:p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-4">
                      <div className="flex-1">
                        <div className="space-y-1 text-xs md:text-sm">
                          <p><strong>{t('mybookings_date')}:</strong> {new Date(res.date).toLocaleDateString()}</p>
                          <p><strong>{t('mybookings_time')}:</strong> {res.time}</p>
                          <p><strong>{t('mybookings_guests')}:</strong> {res.guests}</p>
                        </div>
                        <Badge className="mt-2 text-xs">{getStatusText(res.status)}</Badge>
                      </div>
                      {res.status === 'Pending' && (
                         <Button 
                           variant="destructive" 
                           size="sm"
                           className="h-8 md:h-10 text-xs md:text-sm w-full md:w-auto"
                           onClick={() => handleCancelReservation(res._id)}
                         >
                           {t('mybookings_cancel_reservation_btn')}
                         </Button>
                      )}
                       {res.status === 'Cancelled' && (
                         <Button 
                           variant="destructive" 
                           size="sm"
                           className="h-8 md:h-10 text-xs md:text-sm w-full md:w-auto"
                           onClick={() => handleDeleteReservation(res._id)}
                         >
                           {t('mybookings_delete_reservation_btn')}
                         </Button>
                       )}
                    </div>
                  </div>
                )) : <p className="text-sm md:text-base">{t('mybookings_no_reservations')}</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyBookings; 