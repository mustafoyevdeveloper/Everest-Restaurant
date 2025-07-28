import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, MessageSquare, Mail, MailOpen, Trash, Eye, Filter, RefreshCw, User, Calendar, Send, Reply, Bell } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { apiFetch } from '@/lib/api';
import { createSocketManager, disconnectSocketManager } from '@/lib/socket';
import { useAuth } from '@/context/AuthContext';
import { getAdminStatusText } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  read: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  adminReply?: {
    message: string;
    repliedAt: string;
    repliedBy: string;
  };
  notifications?: Array<{
    type: string;
    message: string;
    sentAt: string;
    sent: boolean;
  }>;
}

interface MessageStats {
  total: number;
  unread: number;
  read: number;
  today: number;
}

const AdminMessages: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [filters, setFilters] = useState({ status: 'all' });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [socket, setSocket] = useState(null);
  const { toast } = useToast();

  const statusOptions = [
    { value: 'all', label: t('admin.messages.allStatuses'), color: 'bg-gray-100 text-gray-800' },
    { value: 'new', label: getAdminStatusText('new'), color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
    { value: 'read', label: getAdminStatusText('read'), color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
    { value: 'replied', label: getAdminStatusText('replied'), color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' },
    { value: 'closed', label: getAdminStatusText('closed'), color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
  ];

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/contacts');
      // Handle paginated response structure
      const messagesData = data.data?.docs || data.data || [];
      setMessages(messagesData);
    } catch (err: any) {
      setError(err.message || t('admin.messages.fetchError'));
      toast({ title: t('admin.messages.error'), description: err.message || t('admin.messages.fetchError'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Calculate stats from messages
      const total = messages.length;
      const unread = messages.filter(m => !m.read).length;
      const read = messages.filter(m => m.read).length;
      const today = messages.filter(m => {
        const today = new Date();
        const messageDate = new Date(m.createdAt);
        return today.toDateString() === messageDate.toDateString();
      }).length;
      
      setStats({ total, unread, read, today });
    } catch (err) {}
  };

  // WebSocket connection for real-time updates
  useEffect(() => {
    let socketManager: any = null;
    
    if (user?.role === 'admin' && user?.token) {
      socketManager = createSocketManager({
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
          console.log('✅ Messages socket connected successfully');
          setSocket(socket);

          // Yangi xabar kelganda
          socketManager.on('new_contact_message', (data) => {
            console.log('Yangi xabar keldi (Messages):', data);
            // Yangi xabarni ro'yxatga qo'shish
            const newMessage: ContactMessage = {
              _id: data.contactId,
              name: data.contact.name,
              email: data.contact.email,
              phone: data.contact.phone,
              message: data.contact.message,
              read: false,
              status: 'new',
              createdAt: data.contact.createdAt,
              updatedAt: data.contact.createdAt
            };
            
            setMessages(prev => [newMessage, ...prev]);
            
            // Toast xabarini ko'rsatish
            toast({ 
              title: 'Yangi xabar', 
              description: `${data.contact.name} dan yangi xabar keldi`,
            });
          });
        })
        .catch((error) => {
          console.error('❌ Failed to connect messages socket:', error);
        });

      return () => {
        if (socketManager) {
          disconnectSocketManager();
        }
      };
    }
  }, [user, toast]);

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line
  }, [messages]);

  const handleMarkAsRead = async (id: string) => {
    setUpdatingId(id);
    try {
      await apiFetch(`/contacts/${id}/read`, { method: 'PUT' });
      toast({ title: t('admin.messages.toast.success'), description: t('admin.messages.toast.statusUpdated') });
      fetchMessages();
    } catch (err: any) {
      toast({ title: t('admin.messages.toast.error'), description: err.message || t('admin.messages.toast.statusUpdateError'), variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyMessage.trim()) {
      toast({ title: 'Xato', description: 'Javob matni kiritilishi kerak', variant: 'destructive' });
      return;
    }

    setSendingReply(true);
    try {
      await apiFetch(`/contacts/${selectedMessage._id}/reply`, {
        method: 'PUT',
        body: JSON.stringify({ message: replyMessage.trim() })
      });
      
      toast({ title: t('admin.messages.toast.success'), description: t('admin.messages.toast.replySent') });
      setIsReplyModalOpen(false);
      setReplyMessage('');
      fetchMessages();
    } catch (err: any) {
      toast({ title: t('admin.messages.toast.error'), description: err.message || t('admin.messages.toast.replyError'), variant: 'destructive' });
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await apiFetch(`/contacts/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      toast({ title: t('admin.messages.toast.success'), description: t('admin.messages.toast.statusUpdated') });
      fetchMessages();
    } catch (err: any) {
      toast({ title: t('admin.messages.toast.error'), description: err.message || t('admin.messages.toast.statusUpdateError'), variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setUpdatingId(id);
    try {
      await apiFetch(`/contacts/${id}`, { method: 'DELETE' });
      toast({ title: t('admin.messages.toast.success'), description: t('admin.messages.toast.messageDeleted') });
      fetchMessages();
    } catch (err: any) {
      toast({ title: t('admin.messages.toast.error'), description: err.message || t('admin.messages.toast.deleteError'), variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const openDetails = (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsDetailsModalOpen(true);
    // Auto mark as read when opening details
    if (!message.read) {
      handleMarkAsRead(message._id);
    }
  };

  const openReply = (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsReplyModalOpen(true);
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

  const filteredMessages = messages.filter(m => {
    if (filters.status && filters.status !== 'all' && m.status !== filters.status) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const opt = statusOptions.find(o => o.value === status);
    return opt ? (
      <Badge className={opt.color}>
        {opt.label}
      </Badge>
    ) : (
      <Badge variant="secondary">{status}</Badge>
    );
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="admin-section p-4 md:p-6">
      {/* Header */}
      <div className="admin-header">
        <h1 className="admin-title !text-black dark:!text-white">{t('admin.messages.title', 'Xabarlar')}</h1>
        <Button onClick={fetchMessages} disabled={loading} variant="outline" size="sm" className="admin-button">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t('admin.messages.refresh', 'Refresh')}
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600 dark:text-gray-400">{t('admin.messages.stats.total')}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600 dark:text-gray-400">{t('admin.messages.stats.unread')}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.unread}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
            <div className="flex items-center">
              <MailOpen className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600 dark:text-gray-400">{t('admin.messages.stats.read')}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.read}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600 dark:text-gray-400">{t('admin.messages.stats.today')}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.today}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="w-5 h-5" />
          <h3 className="font-semibold">{t('admin.messages.filters', 'Filtrlash')}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('admin.messages.status', 'Holat')}</label>
          <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.messages.allStatuses', 'Barcha holatlar')} />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        </div>
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : filteredMessages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">{t('admin.messages.noMessages', 'Xabarlar topilmadi')}</div>
      ) : (
          <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.messages.sender')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.messages.contact')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.messages.message')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.messages.status')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.messages.date')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.messages.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {filteredMessages.map((message) => (
                    <tr key={message._id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-slate-600 dark:text-gray-400" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {message.name}
                            </div>
                            {!message.read && (
                              <Badge variant="destructive" className="text-xs mt-1">
                                {t('admin.messages.new')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{message.email}</div>
                        <div className="text-sm text-gray-500">{message.phone}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {message.message}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(message.status)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(message.createdAt)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetails(message)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {message.status !== 'replied' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openReply(message)}
                            >
                              <Reply className="w-4 h-4" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('admin.messages.deleteMessage', 'Xabarni o\'chirish')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('admin.messages.deleteConfirm', 'Bu xabarni o\'chirishni xohlaysizmi? Bu amalni qaytarib bo\'lmaydi.')}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('admin.messages.cancel', 'Bekor qilish')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(message._id)}>
                                  {t('admin.messages.delete', 'O\'chirish')}
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredMessages.map((message) => (
              <div key={message._id} className="bg-white dark:bg-slate-800 rounded-lg border p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-slate-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{message.name}</h3>
                      <p className="text-sm text-gray-500">{message.email}</p>
                      <p className="text-sm text-gray-500">{message.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                      {getStatusBadge(message.status)}
                      {!message.read && (
                        <Badge variant="destructive" className="text-xs">
                          {t('admin.messages.new')}
                        </Badge>
                      )}
                    </div>
                </div>

                {/* Message Preview */}
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                  <p className="text-sm text-gray-900 dark:text-white line-clamp-3">
                    {message.message}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-slate-700">
                  <div className="text-xs text-gray-500">
                      {formatDate(message.createdAt)}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetails(message)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {message.status !== 'replied' && (
                      <Button
                        variant="ghost"
                        size="sm"
                      onClick={() => openReply(message)}
                        className="h-8 w-8 p-0"
                    >
                        <Reply className="w-4 h-4" />
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>{t('admin.messages.deleteMessage', 'Xabarni o\'chirish')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('admin.messages.deleteConfirm', 'Bu xabarni o\'chirishni xohlaysizmi? Bu amalni qaytarib bo\'lmaydi.')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>{t('admin.messages.cancel', 'Bekor qilish')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(message._id)}>
                            {t('admin.messages.delete', 'O\'chirish')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.messages.messageDetails', 'Xabar tafsilotlari')}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-6">
              {/* Message Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{t('admin.messages.name', 'Ism')}</Label>
                  <p className="text-sm text-slate-600 dark:text-gray-400">{selectedMessage.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('admin.messages.email', 'Email')}</Label>
                  <p className="text-sm text-slate-600 dark:text-gray-400">{selectedMessage.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('admin.messages.phone', 'Telefon')}</Label>
                  <p className="text-sm text-slate-600 dark:text-gray-400">{selectedMessage.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('admin.messages.date', 'Sana')}</Label>
                  <p className="text-sm text-slate-600 dark:text-gray-400">{formatDate(selectedMessage.createdAt)}</p>
                </div>
              </div>
              
              {/* Message Content */}
              <div>
                <Label className="text-sm font-medium">{t('admin.messages.message', 'Xabar')}</Label>
                <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm text-slate-800 dark:text-white whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>
              
              {/* Admin Reply */}
              {selectedMessage.adminReply && (
                <div>
                  <Label className="text-sm font-medium">{t('admin.messages.adminReply', 'Admin javobi')}</Label>
                  <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{selectedMessage.adminReply.message}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      {formatDate(selectedMessage.adminReply.repliedAt)}
                    </p>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {selectedMessage.notifications && selectedMessage.notifications.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">{t('admin.messages.notifications', 'Bildirishnomalar')}</Label>
                  <div className="mt-2 space-y-3">
                    {selectedMessage.notifications.map((notification, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <Bell className="w-4 h-4 text-green-500 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm text-green-600 dark:text-green-400">{notification.message}</span>
                          <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">
                          {formatDate(notification.sentAt)}
                        </span>
                        {!notification.sent && (
                          <Badge variant="secondary" className="text-xs">
                            {t('admin.messages.new')}
                          </Badge>
                        )}
                          </div>
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

      {/* Reply Modal */}
      <Dialog open={isReplyModalOpen} onOpenChange={setIsReplyModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('admin.messages.writeReply', 'Javob yozish')}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">{t('admin.messages.customerMessage', 'Mijoz xabari')}</Label>
                <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm text-slate-800 dark:text-white">{selectedMessage.message}</p>
                </div>
              </div>
              <div>
                <Label htmlFor="reply" className="text-sm font-medium">{t('admin.messages.yourReply', 'Javobingiz')}</Label>
                <Textarea
                  id="reply"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder={t('admin.messages.replyPlaceholder', 'Javobingizni yozing...')}
                  rows={5}
                  className="mt-2"
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsReplyModalOpen(false)}
                  className="w-full sm:w-auto"
                >
                  {t('admin.messages.cancel', 'Bekor qilish')}
                </Button>
                <Button
                  onClick={handleReply}
                  disabled={sendingReply || !replyMessage.trim()}
                  className="w-full sm:w-auto"
                >
                  {sendingReply ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('admin.messages.sending', 'Yuborilmoqda...')}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {t('admin.messages.sendReply', 'Javob yuborish')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMessages; 