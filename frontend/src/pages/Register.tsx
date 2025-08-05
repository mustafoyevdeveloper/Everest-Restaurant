import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

const Register = () => {
  const { t } = useTranslation();
  const { signup, verifyCode } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [verifyEmail, setVerifyEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 1: Manual signup form submit
  const handleManualSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    
    try {
      await signup(name, email, password);
      setVerifyEmail(email);
      setStep('verify');
      toast({ 
        title: t('register_code_sent_title'), 
        description: t('register_code_sent_desc') 
      });
    } catch (error: any) {
      // Backend dan kelgan xabarni to'g'ridan-to'g'ri ko'rsatish
      toast({ 
        title: t('register_fail_toast_title'), 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await verifyCode(verifyEmail, code);
      toast({ 
        title: t('verify_success_title'), 
        description: t('verify_success_description') 
      });
      
      // Redirect based on profile completion
      if (result.redirectTo === 'home') {
        navigate('/');
      } else {
        navigate('/profile');
      }
    } catch (error: any) {
      toast({ 
        title: t('verify_error_title'), 
        description: error.message || t('verify_error_description'), 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <div className="pt-32 pb-12 md:pt-40 md:pb-20">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-8 animate-fade-in">
            {step === 'form' && (
              <>
                <h1 className="text-3xl font-bold mb-6 text-center">{t('register_title')}</h1>
                <form onSubmit={handleManualSignup} className="space-y-6">
                  <Input name="name" type="text" placeholder={t('register_form_name_placeholder')} required />
                  <Input name="email" type="email" placeholder={t('register_form_email_placeholder')} required />
                  <div className="relative">
                    <Input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('register_form_password_placeholder')}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-400"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('register_form_submit')}
                  </Button>
                </form>
                
                {/* Google OAuth Button */}
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                        {t('register_or')}
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
                    disabled={loading}
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
                    {t('register_with_google')}
                  </Button>
                </div>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('register_already_have_account')}{' '}
                    <a href="/login" className="text-blue-600 hover:text-blue-500">
                      {t('register_login_link')}
                    </a>
                  </p>
                </div>
              </>
            )}

            {step === 'verify' && (
              <>
                <h1 className="text-3xl font-bold mb-6 text-center">{t('verify_title')}</h1>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                  {t('verify_description')} <strong>{verifyEmail}</strong>
                </p>
                <form onSubmit={handleVerifyCode} className="space-y-6">
                  <Input
                    type="text"
                    placeholder={t('verify_code_placeholder')}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('verify_submit')}
                  </Button>
                </form>
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setStep('form')}
                    className="text-blue-600 hover:text-blue-500 text-sm"
                  >
                    {t('verify_back_to_signup')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;
