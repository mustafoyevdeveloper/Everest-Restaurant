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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { manualLogin } = useAuth();

  const [step, setStep] = useState<'form' | 'verify' | 'set-password'>('form');
  const [manualData, setManualData] = useState({ name: '', email: '', password: '' });
  const [verifyEmail, setVerifyEmail] = useState('');
  const [isManual, setIsManual] = useState(true);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
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
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setManualData({ name, email, password });
        setVerifyEmail(email);
        setIsManual(true);
        setStep('verify');
        // YANGI QISM: Emailga kod yuborish
        try {
          await apiFetch('/send-verification-code', {
            method: 'POST',
            body: JSON.stringify({ email })
          });
        toast({ title: t('register_code_sent_title'), description: t('register_code_sent_desc') });
        } catch (err) {
          toast({ title: t('verify_error_title'), description: t('verify_code_send_error'), variant: 'destructive' });
        }
      } else {
        toast({ title: t('register_fail_toast_title'), description: data.message || t('register_fail_toast_description'), variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: t('register_fail_toast_title'), description: t('register_fail_toast_description'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail, code }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep('set-password');
        toast({ title: t('verify_success_title'), description: t('verify_success_description') });
      } else {
        toast({ title: t('verify_error_title'), description: data.message || t('verify_error_description'), variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: t('verify_error_title'), description: t('verify_network_error'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set password
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail, password }),
      });
      const data = await res.json();
      if (res.ok) {
        manualLogin(data.user, data.token);
        toast({ title: t('set_password_success_title'), description: t('set_password_success_description') });
        navigate('/profile');
      } else {
        toast({ title: t('set_password_error_title'), description: data.message || t('set_password_fail_description'), variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: t('set_password_error_title'), description: t('set_password_network_error'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <div className="pt-32 pb-12 md:pt-40 md:pb-20">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <div className="bg-white dark:glass-card shadow-lg rounded-lg p-8 animate-fade-in">
            {step === 'form' && (
              <>
                <h1 className="text-3xl font-bold mb-6 text-center">{t('register_title')}</h1>
                <form onSubmit={handleManualSignup} className="space-y-6">
                  <Input name="name" type="text" placeholder={t('register_form_name_placeholder')} required />
                  <Input name="email" type="email" placeholder={t('register_form_email_placeholder')} required />
                  <div className="relative">
                    <Input name="password" type={showPassword ? 'text' : 'password'} placeholder={t('register_form_password_placeholder')} required />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? t('register_form_submitting_button') : t('register_form_submit_button')}</Button>
                </form>
                <div className="mt-6 text-center text-sm">
                  <span className="text-gray-400">{t('register_have_account')}</span>
                  <span
                    className="ml-1 text-yellow-500 font-semibold cursor-pointer hover:underline"
                    onClick={() => navigate('/login')}
                  >
                    {t('register_login')}
                  </span>
                </div>
              </>
            )}
            {step === 'verify' && (
              <>
                <h2 className="text-xl font-bold mb-4 text-center">{t('verify_title')}</h2>
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <p className="mb-2 text-sm text-gray-600 dark:text-gray-300 text-center">
                    {t('verify_description')} <span className="font-semibold">{verifyEmail}</span>
                  </p>
                  <Input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder={t('verify_code_placeholder')} maxLength={6} className="text-center tracking-widest text-lg" required />
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? t('verify_verifying') : t('verify_button')}</Button>
                </form>
              </>
            )}
            {step === 'set-password' && (
              <>
                <h2 className="text-xl font-bold mb-4 text-center">{t('set_password_title')}</h2>
                <form onSubmit={handleSetPassword} className="space-y-4">
                  <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={t('set_password_new_placeholder')} required />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? t('set_password_setting') : t('set_password_button')}</Button>
                </form>
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
