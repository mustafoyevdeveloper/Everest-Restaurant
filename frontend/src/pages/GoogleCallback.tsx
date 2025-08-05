import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

const GoogleCallback = () => {
  const { handleGoogleCallback } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const token = searchParams.get('token');
    const userData = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      toast({
        title: t('google_auth_error_title'),
        description: t('google_auth_error_description'),
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    if (token && userData) {
      try {
        handleGoogleCallback(token, userData);
        toast({
          title: t('google_auth_success_title'),
          description: t('google_auth_success_description'),
        });
        navigate('/');
      } catch (error) {
        toast({
          title: t('google_auth_error_title'),
          description: t('google_auth_error_description'),
          variant: 'destructive',
        });
        navigate('/login');
      }
    } else {
      toast({
        title: t('google_auth_error_title'),
        description: t('google_auth_error_description'),
        variant: 'destructive',
      });
      navigate('/login');
    }
  }, [handleGoogleCallback, navigate, searchParams, toast, t]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600 dark:text-gray-400">
          {t('google_auth_processing')}
        </p>
      </div>
    </div>
  );
};

export default GoogleCallback; 