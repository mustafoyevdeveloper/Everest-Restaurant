import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, MapPin, Phone, Clock, Mail, MessageSquare, Bell, User } from 'lucide-react';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { createSocketManager, disconnectSocketManager } from '@/lib/socket';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().min(1, { message: 'Phone number is required.' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
});

type FormData = z.infer<typeof formSchema>;

const Contact = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userMessages, setUserMessages] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  // Foydalanuvchining xabarlarini yuklash
  const loadUserMessages = async () => {
    if (!user) return;
    
    setLoadingMessages(true);
    try {
      const response = await apiFetch('/contacts/user/messages');
      setUserMessages(response.data?.docs || []);
    } catch (error) {
      console.error('Failed to load user messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // O'qilmagan bildirishnomalar sonini yuklash
  const loadUnreadNotifications = async () => {
    if (!user) return;
    
    try {
      const response = await apiFetch('/contacts/user/notifications/count');
      setUnreadNotifications(response.count || 0);
    } catch (error) {
      console.error('Failed to load notifications count:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserMessages();
      loadUnreadNotifications();
    }
  }, [user]);

  useEffect(() => {
    // Foydalanuvchi login bo'lsa, telefon raqami inputini avtomatik to'ldirish
    if (user) {
      form.setValue('name', user.name || '');
      form.setValue('email', user.email || '');
      form.setValue('phone', user.phone || '');
    }
  }, [user]);

  // WebSocket connection for real-time notifications
  useEffect(() => {
    if (user) {
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
          console.log('✅ Contact notification socket connected');

          // Admin javob berganida
          socketManager.on('contact_replied', (data) => {
            console.log('Admin javob berdi:', data);
            
            // Toast bildirishnoma ko'rsatish
            toast({
              title: t('contact_admin_reply_toast_title', 'Admin javob berdi'),
              description: t('contact_admin_reply_toast_description', 'Sizning xabaringizga javob berildi'),
            });

            // Xabarlar ro'yxatini yangilash
            loadUserMessages();
            loadUnreadNotifications();
          });

          // Xabar o'qilganda
          socketManager.on('contact_read', (data) => {
            console.log('Xabar o\'qildi:', data);
            
            // Xabarlar ro'yxatini yangilash
            loadUserMessages();
            loadUnreadNotifications();
          });
        })
        .catch((error) => {
          console.error('❌ Failed to connect contact socket:', error);
        });

      return () => {
        disconnectSocketManager();
      };
    }
  }, [user, toast, t]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await apiFetch('/contacts', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      toast({
        title: t('contact_success_toast_title'),
        description: t('contact_success_toast_description'),
      });
      form.reset();

      // Agar foydalanuvchi tizimga kirgan bo'lsa, xabarlar ro'yxatini yangilash
      if (user) {
        loadUserMessages();
      }
    } catch (error: any) {
      toast({
        title: t('contact_error_toast_title'),
        description: error.message || t('contact_error_toast_description'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      await apiFetch('/contacts/user/notifications/read', {
        method: 'PUT'
      });
      setUnreadNotifications(0);
      loadUserMessages(); // Xabarlar ro'yxatini yangilash
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'new': return t('status_new', 'Yangi');
      case 'read': return t('status_read', 'O\'qildi');
      case 'replied': return t('status_replied', 'Javob berildi');
      case 'closed': return t('status_closed', 'Yopildi');
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'read': return 'bg-green-500';
      case 'replied': return 'bg-purple-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      {/* Page Header */}
      <div className="pt-32 pb-12 md:pt-40 md:pb-20 bg-slate-100 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold gradient-text mb-4">
              {t('contact_title')}
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 dark:text-gray-400 max-w-3xl mx-auto">
              {t('contact_description')}
            </p>
          </div>
        </div>
      </div>
      
      {/* Contact Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Contact Form */}
          <div className="bg-white dark:glass-card p-8 animate-fade-in rounded-lg shadow-xl">
            <h2 className="text-2xl font-display font-bold mb-6 text-slate-800 dark:text-white">{t('contact_form_title')}</h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600 dark:text-gray-300">{t('contact_form_name')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('contact_form_name_placeholder')} className="bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600 dark:text-gray-300">{t('contact_form_email')}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder={t('contact_form_email_placeholder')} className="bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contact_phone_label')}</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder={t('contact_phone_placeholder')}
                          {...field}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600 dark:text-gray-300">{t('contact_form_message')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('contact_form_message_placeholder')}
                          className="bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white min-h-[150px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-slate-800 text-white dark:bg-gradient-to-r dark:from-yellow-400 dark:to-amber-500 dark:text-slate-900 hover:bg-slate-700 dark:hover:from-yellow-500 dark:hover:to-amber-600 mt-4 disabled:opacity-50"
                >
                  <Send className="mr-2 h-4 w-4" /> 
                  {loading ? t('contact_form_submitting_button') : t('contact_form_submit_button')}
                </Button>
              </form>
            </Form>
          </div>
          
          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-white dark:glass-card p-8 animate-fade-in rounded-lg shadow-xl" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-2xl font-display font-bold mb-6 text-slate-800 dark:text-white">{t('contact_info_title')}</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <MapPin className="w-6 h-6 text-yellow-400 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-white">{t('contact_info_address_title')}</h3>
                    <p className="text-slate-500 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: t('contact_info_address_value')}} />
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Phone className="w-6 h-6 text-yellow-400 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-white">{t('contact_info_phone_title')}</h3>
                    <p className="text-slate-500 dark:text-gray-400">+1 (555) 123-4567</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Mail className="w-6 h-6 text-yellow-400 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-white">{t('contact_info_email_title')}</h3>
                    <p className="text-slate-500 dark:text-gray-400">hello@everestrest.com</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:glass-card p-8 animate-fade-in rounded-lg shadow-xl" style={{ animationDelay: '0.4s' }}>
              <h2 className="text-2xl font-display font-bold mb-6 text-slate-800 dark:text-white">{t('contact_hours_title')}</h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <Clock className="w-6 h-6 text-yellow-400 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-white">{t('contact_hours_weekdays_title')}</h3>
                    <p className="text-slate-500 dark:text-gray-400">{t('contact_hours_weekdays_value')}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Clock className="w-6 h-6 text-yellow-400 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-white">{t('contact_hours_weekends_title')}</h3>
                    <p className="text-slate-500 dark:text-gray-400">{t('contact_hours_weekends_value')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Map */}
        <div className="mt-16 bg-white dark:glass-card p-2 animate-fade-in rounded-lg shadow-xl" style={{ animationDelay: '0.6s' }}>
          <div className="aspect-video w-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center rounded-md overflow-hidden">
            <iframe
              title="Everest Restaurant Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2995.997964073624!2d69.2400730764776!3d41.2994959713077!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38ae8b0e8b8b8b8b%3A0x8b8b8b8b8b8b8b8b!2sAmir%20Temur%20ko'chasi%2C%20Toshkent!5e0!3m2!1suz!2s!4v1700000000000!5m2!1suz!2s"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>

        {/* User Messages Section - Only show if user is logged in */}
        {user && (
          <div className="mt-16 bg-white dark:glass-card p-8 animate-fade-in rounded-lg shadow-xl" style={{ animationDelay: '0.8s' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">
                  {t('contact_my_messages_title', 'Mening xabarlarim')}
                </h2>
                <p className="text-slate-600 dark:text-gray-400">
                  {t('contact_my_messages_description', 'Sizning yuborgan xabarlaringiz va admin javoblari')}
                </p>
              </div>
              {unreadNotifications > 0 && (
                <Button 
                  onClick={markNotificationsAsRead}
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  {t('contact_mark_all_read', 'Barchasini o\'qildi deb belgilash')} ({unreadNotifications})
                </Button>
              )}
            </div>

            {loadingMessages ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : userMessages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-gray-400">
                  {t('contact_no_messages', 'Hali xabar yubormagansiz')}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {userMessages.map((message) => (
                  <div key={message._id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                    {/* User's original message */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="font-medium text-slate-800 dark:text-white">
                            {t('contact_my_message', 'Sizning xabaringiz')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(message.status)}>
                            {getStatusText(message.status)}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            {new Date(message.createdAt).toLocaleDateString('uz-UZ', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                        <p className="text-slate-700 dark:text-gray-300">{message.message}</p>
                      </div>
                    </div>

                    {/* Admin reply if exists */}
                    {message.adminReply && (
                      <div className="border-l-4 border-yellow-400 pl-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium text-slate-800 dark:text-white">
                            {t('contact_admin_reply', 'Admin javobi')}
                          </span>
                          <span className="text-sm text-slate-500">
                            {new Date(message.adminReply.repliedAt).toLocaleDateString('uz-UZ', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                          <p className="text-slate-700 dark:text-gray-300">{message.adminReply.message}</p>
                        </div>
                      </div>
                    )}

                    {/* Notifications if any */}
                    {message.notifications && message.notifications.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {message.notifications.map((notification, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-slate-500">
                            <Bell className="w-3 h-3" />
                            <span>{notification.message}</span>
                            <span className="text-xs">
                              {new Date(notification.sentAt).toLocaleDateString('uz-UZ', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Contact;
