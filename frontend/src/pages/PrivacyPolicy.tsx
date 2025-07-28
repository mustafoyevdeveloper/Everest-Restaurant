import React from 'react';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Navbar />
      
      {/* Page Header */}
      <div className="pt-32 pb-12 md:pt-40 md:pb-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold gradient-text mb-4">
              {t('privacy_policy_title')}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {t('privacy_policy_subtitle')}
            </p>
          </div>
        </div>
      </div>
      
      {/* Privacy Policy Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
        <div className="bg-white dark:glass-card p-8 animate-fade-in space-y-8 shadow-md">
          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-slate-900 dark:text-white">{t('privacy_policy_information_collect_title')}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('privacy_policy_information_collect_desc')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-slate-900 dark:text-white">{t('privacy_policy_how_use_title')}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t('privacy_policy_how_use_desc')}
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>{t('privacy_policy_how_use_process_orders')}</li>
              <li>{t('privacy_policy_how_use_communicate')}</li>
              <li>{t('privacy_policy_how_use_promotions')}</li>
              <li>{t('privacy_policy_how_use_improve')}</li>
              <li>{t('privacy_policy_how_use_legal')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-slate-900 dark:text-white">{t('privacy_policy_sharing_title')}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('privacy_policy_sharing_desc')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-slate-900 dark:text-white">{t('privacy_policy_security_title')}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('privacy_policy_security_desc')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-slate-900 dark:text-white">{t('privacy_policy_contact_title')}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('privacy_policy_contact_desc')}
            </p>
            <div className="mt-4 text-gray-700 dark:text-gray-300">
              <p>{t('privacy_policy_contact_email')}</p>
              <p>{t('privacy_policy_contact_phone')}</p>
              <p>{t('privacy_policy_contact_address')}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-slate-900 dark:text-white">{t('privacy_policy_updates_title')}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('privacy_policy_updates_desc')}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">
              {t('privacy_policy_last_updated', { date: new Date().toLocaleDateString() })}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
