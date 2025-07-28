import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, User, Phone, Mail, Lock, AlertCircle, CheckCircle, Edit, Save, X } from 'lucide-react';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { Navigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUser, isNewUser, isProfileComplete, loading } = useAuth();
  const { toast } = useToast();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile completion modal
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Check if profile is complete
  useEffect(() => {
    if (user) {
      const complete = isProfileComplete();
      
      // If profile is not complete, show modal
      if (!complete) {
        setShowCompletionModal(true);
      }
    }
  }, [user, isProfileComplete]);

  // Update form when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Prevent navigation away from profile if user is new and profile is incomplete
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (user && isNewUser() && !isProfileComplete()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, isNewUser, isProfileComplete]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form to current user data
      setProfileForm({
        name: user?.name || '',
        phone: user?.phone || '',
      });
    }
    setIsEditing(!isEditing);
  };

  // Auto-save functionality - save changes automatically after a delay
  useEffect(() => {
    if (isEditing && (profileForm.name !== (user?.name || '') || profileForm.phone !== (user?.phone || ''))) {
      const timeoutId = setTimeout(() => {
        // Auto-save after 3 seconds of no changes
        if (isEditing && !profileLoading) {
          // Only auto-save if there are actual changes
          if (profileForm.name.trim() && profileForm.name !== (user?.name || '')) {
            handleAutoSave();
          }
        }
      }, 3000);

      return () => clearTimeout(timeoutId);
    }
  }, [profileForm, isEditing, user, profileLoading]);

  const handleAutoSave = async () => {
    if (profileLoading) return;

    // Telefon raqam validatsiyasi
    if (profileForm.phone) {
      const phoneRegex = /^\+998[0-9]{9}$/;
      if (!phoneRegex.test(profileForm.phone)) {
        return; // Don't auto-save invalid phone
      }
    }

    // Ism validatsiyasi
    if (!profileForm.name.trim()) {
      return; // Don't auto-save empty name
    }

    try {
      const response = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileForm),
      });

      if (response) {
        // Update user context
        if (updateUser) {
          updateUser(response.user);
        }
        
        // Check if profile is now complete
        const complete = isProfileComplete();
        
        if (complete) {
          setShowCompletionModal(false);
        }

        // Show subtle auto-save notification
        toast({
          title: t('profile_auto_save_title', 'Avtomatik saqlandi'),
          description: t('profile_auto_save_desc', 'O\'zgarishlar avtomatik saqlandi'),
          duration: 2000,
        });

        // Tahrirlash rejimida qolish
        // setIsEditing(false); // Bu qatorni o'chirib qo'yamiz
      }
    } catch (error: any) {
      // Don't show error for auto-save, just log it
      console.log('Auto-save failed:', error);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);

    // Telefon raqam validatsiyasi
    if (profileForm.phone) {
      const phoneRegex = /^\+998[0-9]{9}$/;
      if (!phoneRegex.test(profileForm.phone)) {
        toast({
          title: t('profile_phone_error_title', 'Telefon raqam xatosi'),
          description: t('profile_phone_error_desc', 'Telefon raqam +998XXXXXXXXX formatida bo\'lishi kerak'),
          variant: 'destructive',
        });
        setProfileLoading(false);
        return;
      }
    }

    // Ism validatsiyasi
    if (!profileForm.name.trim()) {
      toast({
        title: t('profile_name_error_title', 'Ism xatosi'),
        description: t('profile_name_error_desc', 'Ism maydoni bo\'sh bo\'lishi mumkin emas'),
        variant: 'destructive',
      });
      setProfileLoading(false);
      return;
    }

    try {
      const response = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileForm),
      });

      if (response) {
        toast({
          title: t('profile_success_title', 'Muvaffaqiyatli!'),
          description: t('profile_success_description', 'Profil muvaffaqiyatli yangilandi'),
        });
        
        // Update user context
        if (updateUser) {
          updateUser(response.user);
        }
        
        // Check if profile is now complete
        const complete = isProfileComplete();
        
        if (complete) {
          setShowCompletionModal(false);
        }

        // Tahrirlash rejimida qolish - foydalanuvchi yana tahrirlay olsin
        // setIsEditing(false); // Bu qatorni o'chirib qo'yamiz
      }
    } catch (error: any) {
      toast({
        title: t('profile_error_title', 'Xatolik'),
        description: error.message || t('profile_error_description', 'Profilni yangilashda xatolik yuz berdi'),
        variant: 'destructive',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: t('password_error_title', 'Parol xatosi'),
        description: t('password_length_error', 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
        variant: 'destructive',
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: t('password_error_title', 'Parol xatosi'),
        description: t('password_match_error', 'Parollar mos kelmadi'),
        variant: 'destructive',
      });
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await apiFetch('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response) {
        toast({
          title: t('password_success_title', 'Muvaffaqiyatli!'),
          description: t('password_success_description', 'Parol muvaffaqiyatli o\'zgartirildi'),
        });
        
        // Clear password form
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error: any) {
      toast({
        title: t('password_error_title', 'Parol xatosi'),
        description: error.message || t('password_error_description', 'Parolni o\'zgartirishda xatolik yuz berdi'),
        variant: 'destructive',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Profile completion status
  const getProfileCompletionStatus = () => {
    if (!user) return { complete: false, missing: [] };
    
    const missing = [];
    if (!user.name) missing.push('name');
    if (!user.phone) missing.push('phone');
    if (!user.email) missing.push('email');
    
    return {
      complete: missing.length === 0,
      missing
    };
  };

  const status = getProfileCompletionStatus();

  // Faqat hooklardan keyin shartli render
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-gray-400">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navbar />
      
      <div className="pt-32 pb-12 md:pt-40 md:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Profile Completion Banner */}
          {!status.complete && (
            <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <h3 className="font-medium text-amber-800 dark:text-amber-200">
                    {t('profile_completion_required', 'Profil ma\'lumotlari to\'ldirilmagan')}
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {t('profile_completion_desc', 'Davom etish uchun barcha ma\'lumotlarni to\'ldiring')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-800 dark:text-white mb-2">
              {t('profile_title', 'Mening profilim')}
            </h1>
            <p className="text-slate-600 dark:text-gray-400">
              {t('profile_description', 'Shaxsiy ma\'lumotlaringizni boshqaring')}
            </p>
            
            {/* Profile completion badge */}
            <div className="mt-4">
              {status.complete ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {t('profile_complete', 'Profil to\'liq')}
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {t('profile_incomplete', 'Profil to\'liq emas')}
                </Badge>
              )}
            </div>

            {/* Edit mode indicator */}
            {isEditing && (
              <div className="mt-4">
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <Edit className="w-4 h-4 mr-1" />
                  {t('profile_edit_mode', 'Tahrirlash rejimi')}
                </Badge>
              </div>
            )}
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Profile Information */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {t('profile_info_title', 'Shaxsiy ma\'lumotlar')}
                </h2>
                <Button
                  variant={isEditing ? "default" : "ghost"}
                  size="sm"
                  onClick={handleEditToggle}
                  className="flex items-center gap-2"
                >
                  {isEditing ? (
                    <>
                      <X className="w-4 h-4" />
                      {t('profile_cancel_edit', 'Bekor qilish')}
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" />
                      {t('profile_edit', 'Tahrirlash')}
                    </>
                  )}
                </Button>
              </div>
              
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    {t('profile_name_label', 'To\'liq ism')}
                  </label>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder={t('profile_name_placeholder', 'To\'liq ismingizni kiriting')}
                      required
                    />
                  ) : (
                    <div className="p-3 bg-gray-100 dark:bg-slate-700 rounded-md">
                      <span className="text-slate-600 dark:text-gray-300">
                        {user?.name || t('profile_no_name', 'Ism kiritilmagan')}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    {t('profile_phone_label', 'Telefon raqam')}
                  </label>
                  {isEditing ? (
                    <div>
                      <Input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder={t('profile_phone_placeholder', '+998901234567')}
                        maxLength={13}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {t('profile_phone_format', 'Format: +998901234567')}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-100 dark:bg-slate-700 rounded-md">
                      <span className="text-slate-600 dark:text-gray-300">
                        {user?.phone || t('profile_no_phone', 'Telefon raqam kiritilmagan')}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    {t('profile_email_label', 'Email manzil')}
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-slate-700 rounded-md">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-slate-600 dark:text-gray-300">{user?.email}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('profile_email_note', 'Email o\'zgartirilmaydi')}
                  </p>
                </div>

                {isEditing && (
                  <div className="space-y-4">
                    <Button 
                      type="submit" 
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                      disabled={profileLoading}
                    >
                      {profileLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {t('profile_saving', 'Saqlanmoqda...')}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          {t('profile_save_button', 'O\'zgarishlarni saqlash')}
                        </div>
                      )}
                    </Button>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-500">
                        {t('profile_edit_hint', 'Ma\'lumotlarni o\'zgartirib, "Saqlash" tugmasini bosing')}
                      </p>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Password Change */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                {t('profile_password_title', 'Parolni o\'zgartirish')}
              </h2>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    {t('profile_current_password', 'Joriy parol')}
                  </label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder={t('profile_current_password_placeholder', 'Joriy parolni kiriting')}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    {t('profile_new_password', 'Yangi parol')}
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder={t('profile_new_password_placeholder', 'Yangi parolni kiriting')}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    {t('profile_confirm_password', 'Parolni tasdiqlang')}
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder={t('profile_confirm_password_placeholder', 'Yangi parolni qayta kiriting')}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white dark:bg-white dark:text-slate-800 dark:hover:bg-slate-200"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t('profile_changing', 'O\'zgartirilmoqda...')}
                    </div>
                  ) : (
                    t('profile_change_password_button', 'Parolni o\'zgartirish')
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Completion Modal */}
      <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              {t('profile_completion_modal_title', 'Profil ma\'lumotlari to\'ldirilmagan')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              {t('profile_completion_modal_desc', 'Davom etish uchun barcha ma\'lumotlarni to\'ldiring. Bu ma\'lumotlar sizning buyurtmalaringiz va aloqangiz uchun zarur.')}
            </p>
            
            <div className="space-y-2">
              <h4 className="font-medium text-slate-800 dark:text-slate-200">
                {t('profile_completion_required_fields', 'To\'ldirilishi kerak bo\'lgan maydonlar:')}
              </h4>
              <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                {!user?.name && (
                  <li className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    {t('profile_completion_name', 'To\'liq ism')}
                  </li>
                )}
                {!user?.phone && (
                  <li className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    {t('profile_completion_phone', 'Telefon raqam')}
                  </li>
                )}
              </ul>
            </div>
            
            <Button 
              onClick={() => setShowCompletionModal(false)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              {t('profile_completion_understand', 'Tushundim')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile; 