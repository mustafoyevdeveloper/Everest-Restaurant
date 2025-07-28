import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, ChevronRight, Users, User, Phone, Mail, MessageSquare, CreditCard } from 'lucide-react';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PaymePayment from '@/components/Payment/PaymePayment';
import { formatCurrency } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader } from 'lucide-react';

const PRICE_PER_GUEST = 20000;

const formSchema = z.object({
  name: z.string().min(2, { message: 'Please enter your full name' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number' }),
  guests: z.number().min(1, 'At least 1 guest').max(12, 'Maximum 12 guests'),
  date: z.date({ required_error: "Please select a date" }),
  time: z.string({ required_error: "Please select a time slot" }),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const timeSlots = [
  '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', 
  '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM'
];

const Reservations = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [createdReservation, setCreatedReservation] = useState<unknown>(null);
  const [showPayment, setShowPayment] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      date: undefined,
      time: '',
      guests: undefined,
    },
  });

  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      toast({
        title: t('reservations_login_required_title'),
        description: t('reservations_login_required_description'),
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }
  }, [user, navigate, t]);

  // Don't render the form if user is not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="pt-24 md:pt-32 pb-8 md:pb-12">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 text-center">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-slate-800 dark:gradient-text mb-4">
              {t('reservations_login_required_toast_title')}
            </h1>
            <p className="text-lg text-slate-600 dark:text-gray-400 mb-6">
              {t('reservations_login_required_toast_description')}
            </p>
            <Button onClick={() => navigate('/login')} className="text-lg px-8 py-3">
              {t('nav_sign_in')}
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const { date, time, guests } = form.watch();
  const safeGuests = guests || 0;
  const totalPrice = safeGuests * PRICE_PER_GUEST;

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const reservationData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        date: data.date,
        time: data.time,
        guests: data.guests,
        pricePerGuest: PRICE_PER_GUEST,
        totalPrice: totalPrice,
        paymentMethod: 'Payme',
        user: user._id
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reservationData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create reservation');
      }

      const newReservation = await response.json();
      setCreatedReservation(newReservation);
      setShowPayment(true);
      
      toast({
        title: t('reservations_created_title'),
        description: t('reservations_created_description'),
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('reservations_fail_toast_description');
      toast({
        title: t('reservations_fail_toast_title'),
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReservation = async () => {
    if (!date || !time || !guests) {
      // ... existing code ...
    } else {
      // ... existing code ...
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <div className="pt-24 md:pt-32 pb-8 md:pb-12">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6">
          <div className="text-center mb-6 md:mb-10">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-slate-800 dark:gradient-text mb-2 md:mb-4">
              {t('reservations_title')}
            </h1>
            <p className="text-sm md:text-xl text-slate-600 dark:text-gray-400 px-2">
              {t('reservations_description_paid')}
            </p>
          </div>
          
          {!showPayment ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-8">
                {/* Reservation Details Section */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 md:pb-6">
                    <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm md:text-base">
                        📅
                      </div>
                      {t('reservations_form_title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm md:text-base">{t('reservations_form_name')}</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-10 md:h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm md:text-base">{t('reservations_form_email')}</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-10 md:h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm md:text-base">{t('reservations_form_phone')}</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-10 md:h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      <FormField control={form.control} name="date" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm md:text-base">{t('reservations_form_date')}</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button variant={"outline"} className={cn("w-full h-10 md:h-11 pl-3 text-left font-normal text-sm md:text-base", !field.value && "text-muted-foreground")}>
                                  {field.value ? format(field.value, "PPP") : <span>{t('reservations_form_date_placeholder')}</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} /></PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="guests" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm md:text-base">{t('reservations_form_guests')}</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input 
                                type="number" 
                                min="1" 
                                max="12" 
                                {...field} 
                                value={field.value || ''}
                                onChange={e => {
                                  const value = parseInt(e.target.value, 10);
                                  field.onChange(value || undefined);
                                }}
                                className="h-10 md:h-11 text-center"
                                placeholder="0"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const currentValue = field.value || 0;
                                  if (currentValue > 1) {
                                    field.onChange(currentValue - 1);
                                  }
                                }}
                                className="h-10 md:h-11 w-10 md:w-11 p-0"
                                disabled={(field.value || 0) <= 1}
                              >
                                -
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const currentValue = field.value || 0;
                                  if (currentValue < 12) {
                                    field.onChange(currentValue + 1);
                                  }
                                }}
                                className="h-10 md:h-11 w-10 md:w-11 p-0"
                                disabled={(field.value || 0) >= 12}
                              >
                                +
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div>
                      <FormLabel className="text-sm md:text-base">{t('reservations_form_time')}</FormLabel>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1 md:gap-2 pt-2">
                        {timeSlots.map(time => (
                          <Button 
                            key={time} 
                            type="button" 
                            variant={form.watch('time') === time ? 'default' : 'outline'} 
                            onClick={() => form.setValue('time', time)}
                            className="h-8 md:h-10 text-xs md:text-sm"
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                      <FormMessage className="pt-2">{form.formState.errors.time?.message}</FormMessage>
                    </div>
                  </CardContent>
                </Card>

                {/* Reservation Summary Section */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 md:pb-6">
                    <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm md:text-base">
                        📋
                      </div>
                      {t('reservations_summary_title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 md:space-y-4">
                      <div className="flex justify-between items-center p-2 md:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="font-medium text-sm md:text-base">{t('reservations_fee_per_guest')}</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400 text-sm md:text-base">{formatCurrency(PRICE_PER_GUEST)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 md:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="font-medium text-sm md:text-base">{t('reservations_guests_count')}</span>
                        <span className="font-bold text-green-600 dark:text-green-400 text-sm md:text-base">{safeGuests}</span>
                      </div>
                      <div className="border-t-2 border-slate-200 dark:border-slate-600 my-3 md:my-4"></div>
                      <div className="flex justify-between items-center p-3 md:p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                        <span className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">{t('checkout_total_label')}</span>
                        <span className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalPrice)}</span>
                      </div>
                      {createdReservation && createdReservation.reservationCode && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-mono text-xs text-gray-500 bg-gray-100 rounded px-2 py-1">{createdReservation.reservationCode}</span>
                          <span className="text-xs text-gray-400">ID</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 md:py-4 text-base md:text-lg font-semibold h-12 md:h-14"
                >
                  {loading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                      <span className="text-sm md:text-base">{t('reservations_creating')}</span>
                    </>
                  ) : (
                    <span className="text-sm md:text-base">{t('reservations_create_button')}</span>
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            /* Payment Section */
            <Card className="shadow-sm">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-sm md:text-base">
                    💳
                  </div>
                  {t('checkout_payment_title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                <PaymePayment
                  reservationId={createdReservation._id}
                  amount={totalPrice}
                  onSuccess={() => {
                    toast({
                      title: t('reservations_success_toast_title'),
                      description: t('reservations_success_toast_description_paid', { price: totalPrice }),
                    });
                    navigate('/my-bookings');
                  }}
                  onFailure={(error) => {
                    toast({
                      title: t('payment.error_title'),
                      description: error,
                      variant: 'destructive',
                    });
                  }}
                  forceCardOnly={true}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reservations;
