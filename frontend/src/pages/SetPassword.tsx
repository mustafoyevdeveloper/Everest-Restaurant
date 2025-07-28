import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';

const SetPassword: React.FC = () => {
  const { t } = useTranslation();
  const { updateUser } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const email = searchParams.get('email');
  const userDataParam = searchParams.get('userData');

  // Parse user data if provided (new user flow)
  const userData = userDataParam ? (() => {
    try {
      return JSON.parse(userDataParam);
    } catch {
      return null;
    }
  })() : null;

  const displayEmail = userData?.email || email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: t('set_password_error_title'), description: t('set_password_length_error'), variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: t('set_password_error_title'), description: t('set_password_match_error'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const requestBody: any = { password };
      
      if (userData) {
        // New user flow - include all user data
        requestBody.email = userData.email;
        requestBody.name = userData.name;
        requestBody.googleId = userData.googleId;
      } else if (email) {
        // Existing user flow - only email and password
        requestBody.email = email;
      } else {
        throw new Error('No email or userData provided');
      }

      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: t('set_password_success_title'), description: t('set_password_success_description') });
        
        // Save user data and token to localStorage
        if (data.user && data.token) {
          localStorage.setItem('token', data.token);
          // Update user context
          if (updateUser) {
            updateUser(data.user);
          }
        }
        
        navigate('/');
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col items-center justify-center" style={{ marginTop: '150px' }}>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded shadow-md w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4 text-center">{t('set_password_title')}</h2>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300 text-center">
            {t('set_password_description')} <span className="font-semibold">{displayEmail}</span>
          </p>
          <div className="relative mb-2">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('set_password_new_placeholder')}
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
          <div className="relative mb-4">
            <Input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
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
            {loading ? t('set_password_setting') : t('set_password_button')}
          </Button>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default SetPassword; 