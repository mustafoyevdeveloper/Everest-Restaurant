import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const PasswordReset = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<'email' | 'code' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 1: Email yuborish
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: t('reset_code_sent_title'), description: t('reset_code_sent_desc') });
        setStep('code');
      } else {
        toast({ title: t('reset_fail_title'), description: data.message || t('reset_fail_desc'), variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Kodni tekshirish
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        setStep('reset');
      } else {
        toast({ title: t('reset_fail_title'), description: data.message || t('reset_fail_desc'), variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Yangi parol o‘rnatish
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: t('reset_fail_title'), description: t('set_password_length_error'), variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: t('reset_fail_title'), description: t('set_password_match_error'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: t('reset_success_title'), description: t('reset_success_desc') });
        navigate('/login');
      } else {
        toast({ title: t('reset_fail_title'), description: data.message || t('reset_fail_desc'), variant: 'destructive' });
      }
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
            {step === 'email' && (
              <form onSubmit={handleSendCode} className="space-y-6">
                <h2 className="text-xl font-bold mb-4 text-center">{t('reset_email_title')}</h2>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('reset_email_placeholder')} required />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('reset_send_code')}
                </Button>
              </form>
            )}
            {step === 'code' && (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <h2 className="text-xl font-bold mb-4 text-center">{t('reset_code_title')}</h2>
                <Input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder={t('reset_code_placeholder')} maxLength={6} required />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('reset_verify_code')}
                </Button>
              </form>
            )}
            {step === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <h2 className="text-xl font-bold mb-4 text-center">{t('reset_new_password_title')}</h2>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder={t('reset_new_password_placeholder')}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? t('set_password_hide_password') : t('set_password_show_password')}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder={t('set_password_confirm_placeholder')}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    tabIndex={-1}
                    onClick={() => setShowConfirm(v => !v)}
                    aria-label={showConfirm ? t('set_password_hide_password') : t('set_password_show_password')}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('reset_set_password')}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PasswordReset; 