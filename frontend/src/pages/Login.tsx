import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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

const Login = () => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, manualLogin, user } = useAuth();
  const { toast } = useToast();

  const formSchema = z.object({
    email: z.string().email({ message: t('login_form_email_error') }),
    password: z.string().min(1, { message: t('login_form_password_error') }),
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const from = location.state?.from?.pathname || '/';
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [user, navigate, from]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast({
        title: t('login_success_toast_title'),
        description: t('login_success_toast_description'),
      });
      if (user && user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: t('login_fail_toast_title'),
        description: error.message || t('login_fail_toast_description'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <div className="pt-32 pb-12 md:pt-40 md:pb-20">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-8 animate-fade-in">
            <h1 className="text-3xl font-bold mb-6 text-center">{t('login_title')}</h1>
            <p className="text-slate-600 dark:text-gray-400 text-center mb-6">{t('login_description')}</p>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Input
                type="email"
                placeholder={t('login_form_email_placeholder')}
                {...form.register('email')}
                required
              />
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('login_form_password_placeholder')}
                  {...form.register('password')}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? t('set_password_hide_password') : t('set_password_show_password')}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex justify-end mb-2">
                <Link to="/reset-password" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                  {t('login_form_forgot_password')}
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('login_form_submit_button')}
              </Button>
            </form>
            <p className="mt-6 text-center text-gray-500">
              {t('login_no_account')}{' '}
              <Link to="/signup" className="text-yellow-500 hover:underline">{t('login_create_account')}</Link>
            </p>
            
            {/* Google OAuth Button */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                    {t('login_or')}
                  </span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full mt-4 flex items-center justify-center gap-2"
                onClick={() => {
                  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                  window.location.href = `${backendUrl}/api/auth/google`;
                }}
                disabled={isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t('login_with_google')}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
