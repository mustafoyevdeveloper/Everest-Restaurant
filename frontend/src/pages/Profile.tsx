import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import Loader from '@/components/ui/Loader';
import { Loader2 } from 'lucide-react';

const Profile = () => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { user, updateProfile, loading } = useAuth();
  const { toast } = useToast();

  const formSchema = z.object({
    phone: z.string().min(1, { message: t('profile_form_phone_error') }),
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: user?.phone || '',
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If user already has phone number, redirect to home
    if (user?.phone) {
      navigate('/');
    }
  }, [user, navigate]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await updateProfile(data.phone);
      toast({
        title: t('profile_success_toast_title'),
        description: t('profile_success_toast_description'),
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: t('profile_fail_toast_title'),
        description: error.message || t('profile_fail_toast_description'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="pt-32 pb-12 md:pt-40 md:pb-20">
          <div className="flex items-center justify-center">
            <Loader />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <div className="pt-32 pb-12 md:pt-40 md:pb-20">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-8 animate-fade-in">
            <h1 className="text-3xl font-bold mb-6 text-center">{t('profile_title')}</h1>
            <p className="text-slate-600 dark:text-gray-400 text-center mb-6">{t('profile_description')}</p>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile_form_name_label')}
                </label>
                <Input
                  type="text"
                  value={user?.name || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile_form_email_label')}
                </label>
                <Input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile_form_phone_label')} *
                </label>
                <Input
                  type="tel"
                  placeholder={t('profile_form_phone_placeholder')}
                  {...form.register('phone')}
                  required
                />
                {form.formState.errors.phone && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('profile_form_submit')}
              </Button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile; 