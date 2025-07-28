import React from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';

const TermsOfService = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      {/* Page Header */}
      <div className="pt-32 pb-12 md:pt-40 md:pb-20 bg-slate-100 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold gradient-text mb-4">
              {t('terms_of_service_title')}
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 dark:text-gray-400 max-w-3xl mx-auto">
              {t('terms_of_service_description')}
            </p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
        <div className="bg-white dark:glass-card p-8 md:p-12 rounded-lg shadow-xl">
          
          {/* Last Updated */}
          <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-gray-400">
              {t('terms_last_updated')}: <span className="font-semibold">2024-yil 1-dekabr</span>
            </p>
          </div>

          {/* Terms Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            
            {/* 1. Acceptance of Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-display font-bold mb-4 text-slate-800 dark:text-white">
                {t('terms_acceptance_title')}
              </h2>
              <p className="text-slate-600 dark:text-gray-300 mb-4">
                {t('terms_acceptance_content')}
              </p>
            </section>

            {/* 2. Service Description */}
            <section className="mb-8">
              <h2 className="text-2xl font-display font-bold mb-4 text-slate-800 dark:text-white">
                {t('terms_service_description_title')}
              </h2>
              <p className="text-slate-600 dark:text-gray-300 mb-4">
                {t('terms_service_description_content')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-gray-300 ml-4">
                <li>{t('terms_service_feature_1')}</li>
                <li>{t('terms_service_feature_2')}</li>
                <li>{t('terms_service_feature_3')}</li>
                <li>{t('terms_service_feature_4')}</li>
                <li>{t('terms_service_feature_5')}</li>
              </ul>
            </section>

            {/* 3. User Registration */}
            <section className="mb-8">
              <h2 className="text-2xl font-display font-bold mb-4 text-slate-800 dark:text-white">
                {t('terms_registration_title')}
              </h2>
              <p className="text-slate-600 dark:text-gray-300 mb-4">
                {t('terms_registration_content')}
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-slate-800 dark:text-white">
                  {t('terms_registration_requirements_title')}
                </h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-gray-300">
                  <li>{t('terms_registration_requirement_1')}</li>
                  <li>{t('terms_registration_requirement_2')}</li>
                  <li>{t('terms_registration_requirement_3')}</li>
                  <li>{t('terms_registration_requirement_4')}</li>
                </ul>
              </div>
            </section>

            {/* 4. Ordering and Payment */}
            <section className="mb-8">
              <h2 className="text-2xl font-display font-bold mb-4 text-slate-800 dark:text-white">
                {t('terms_ordering_title')}
              </h2>
              <p className="text-slate-600 dark:text-gray-300 mb-4">
                {t('terms_ordering_content')}
              </p>
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-slate-800 dark:text-white">
                    {t('terms_ordering_process_title')}
                  </h3>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-gray-300">
                    <li>{t('terms_ordering_step_1')}</li>
                    <li>{t('terms_ordering_step_2')}</li>
                    <li>{t('terms_ordering_step_3')}</li>
                    <li>{t('terms_ordering_step_4')}</li>
                    <li>{t('terms_ordering_step_5')}</li>
                  </ol>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-slate-800 dark:text-white">
                    {t('terms_payment_title')}
                  </h3>
                  <p className="text-slate-600 dark:text-gray-300 mb-2">
                    {t('terms_payment_content')}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-gray-300">
                    <li>{t('terms_payment_method_1')}</li>
                    <li>{t('terms_payment_method_2')}</li>
                    <li>{t('terms_payment_method_3')}</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 5. Reservations */}
            <section className="mb-8">
              <h2 className="text-2xl font-display font-bold mb-4 text-slate-800 dark:text-white">
                {t('terms_reservations_title')}
              </h2>
              <p className="text-slate-600 dark:text-gray-300 mb-4">
                {t('terms_reservations_content')}
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-slate-800 dark:text-white">
                  {t('terms_reservations_rules_title')}
                </h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-gray-300">
                  <li>{t('terms_reservations_rule_1')}</li>
                  <li>{t('terms_reservations_rule_2')}</li>
                  <li>{t('terms_reservations_rule_3')}</li>
                  <li>{t('terms_reservations_rule_4')}</li>
                </ul>
              </div>
            </section>

            {/* 6. User Responsibilities */}
            <section className="mb-8">
              <h2 className="text-2xl font-display font-bold mb-4 text-slate-800 dark:text-white">
                {t('terms_user_responsibilities_title')}
              </h2>
              <p className="text-slate-600 dark:text-gray-300 mb-4">
                {t('terms_user_responsibilities_content')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-gray-300 ml-4">
                <li>{t('terms_user_responsibility_1')}</li>
                <li>{t('terms_user_responsibility_2')}</li>
                <li>{t('terms_user_responsibility_3')}</li>
                <li>{t('terms_user_responsibility_4')}</li>
                <li>{t('terms_user_responsibility_5')}</li>
              </ul>
            </section>

            {/* 7. Prohibited Activities */}
            <section className="mb-8">
              <h2 className="text-2xl font-display font-bold mb-4 text-slate-800 dark:text-white">
                {t('terms_prohibited_title')}
              </h2>
              <p className="text-slate-600 dark:text-gray-300 mb-4">
                {t('terms_prohibited_content')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-gray-300 ml-4">
                <li>{t('terms_prohibited_activity_1')}</li>
                <li>{t('terms_prohibited_activity_2')}</li>
                <li>{t('terms_prohibited_activity_3')}</li>
                <li>{t('terms_prohibited_activity_4')}</li>
                <li>{t('terms_prohibited_activity_5')}</li>
              </ul>
            </section>

            {/* 8. Privacy and Data */}
            <section className="mb-8">
              <h2 className="text-2xl font-display font-bold mb-4 text-slate-800 dark:text-white">
                {t('terms_privacy_title')}
              </h2>
              <p className="text-slate-600 dark:text-gray-300 mb-4">
                {t('terms_privacy_content')}
              </p>
              <p className="text-slate-600 dark:text-gray-300">
                {t('terms_privacy_policy_link')} <a href="/privacy-policy" className="text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300 underline">{t('terms_privacy_policy_text')}</a>.
              </p>
            </section>

            {/* 9. Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-display font-bold mb-4 text-slate-800 dark:text-white">
                {t('terms_liability_title')}
              </h2>
              <p className="text-slate-600 dark:text-gray-300 mb-4">
                {t('terms_liability_content')}
              </p>
            </section>

            {/* 10. Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-display font-bold mb-4 text-slate-800 dark:text-white">
                {t('terms_changes_title')}
              </h2>
              <p className="text-slate-600 dark:text-gray-300 mb-4">
                {t('terms_changes_content')}
              </p>
            </section>

            {/* 11. Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-display font-bold mb-4 text-slate-800 dark:text-white">
                {t('terms_contact_title')}
              </h2>
              <p className="text-slate-600 dark:text-gray-300 mb-4">
                {t('terms_contact_content')}
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p className="text-slate-600 dark:text-gray-300">
                  <strong>{t('terms_contact_email')}:</strong> mustafoyev@gmail.com<br />
                  <strong>{t('terms_contact_phone')}:</strong> +998(50)515-17-00<br />
                  <strong>{t('terms_contact_address')}:</strong> Toshkent shahri, Chilonzor tumani
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService; 