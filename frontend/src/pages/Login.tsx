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
          <div className="bg-white dark:glass-card shadow-lg rounded-lg p-8 animate-fade-in">
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
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
