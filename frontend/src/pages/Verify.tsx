import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '@/lib/api';

const Verify: React.FC = () => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const email = searchParams.get('email');
  const tempDataParam = searchParams.get('tempData');

  // Countdown effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Send verification code
  const sendVerificationCode = async () => {
    if (!email) {
      toast({ title: t('verify_error_title'), description: 'Email topilmadi', variant: 'destructive' });
      return;
    }

    setSendingCode(true);
    try {
      await apiFetch('/auth/send-verification-code', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      
      toast({ title: t('verify_code_sent_title'), description: t('verify_code_sent_description') });
      setCountdown(60); // 60 soniya kutish
    } catch (error: any) {
      toast({ 
        title: t('verify_error_title'), 
        description: error.message || t('verify_code_send_error'), 
        variant: 'destructive' 
      });
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const requestBody: any = { code };
      
      if (tempDataParam) {
        // New user flow - use tempUserData
        requestBody.tempUserData = tempDataParam;
      } else if (email) {
        // Existing user flow - use email
        requestBody.email = email;
      } else {
        throw new Error('No email or tempData provided');
      }

      const data = await apiFetch('/auth/verify-code', {
        method: 'POST',
        body: JSON.stringify({ email, code })
      });
      
        toast({ title: t('verify_success_title'), description: t('verify_success_description') });
        
      // Save token and user data
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/');
      }
    } catch (err) {
      toast({ title: t('verify_error_title'), description: t('verify_network_error'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Get email for display (either from tempData or direct email param)
  const displayEmail = (() => {
    if (tempDataParam) {
      try {
        const userData = JSON.parse(tempDataParam);
        return userData.email;
      } catch {
        return email;
      }
    }
    return email;
  })();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col items-center justify-center" style={{ marginTop: '150px' }}>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded shadow-md w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4 text-center">{t('verify_title')}</h2>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300 text-center">
            {t('verify_description')} <span className="font-semibold">{displayEmail}</span>
          </p>
          
          {/* Send code button */}
          <div className="mb-4">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={sendVerificationCode}
              disabled={sendingCode || countdown > 0}
            >
              {sendingCode ? t('verify_sending_code') : 
               countdown > 0 ? `${t('verify_resend_in')} ${countdown}s` : 
               t('verify_send_code')}
            </Button>
          </div>
          
          <Input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder={t('verify_code_placeholder')}
            maxLength={6}
            className="mb-4 text-center tracking-widest text-lg"
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('verify_verifying') : t('verify_button')}
          </Button>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default Verify; 