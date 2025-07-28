import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AboutMini = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 sm:py-32 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Interior of Everest Restaurant"
              className="rounded-lg shadow-2xl object-cover w-full h-full"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-800 dark:text-white mb-4">
              {t('about_mini_title', 'Biz haqimizda')}
            </h2>
            <p className="text-lg text-slate-600 dark:text-gray-400 mb-6">
              {t('about_mini_text', 'Everest Restaurant — bu nafaqat taom, bu bir tajriba. Har bir luqma, har bir xizmat va har bir atmosferani sevishingiz uchun yaratilgan.')}
            </p>
            <Button asChild size="lg" className="bg-slate-800 text-white hover:bg-slate-700 dark:bg-amber-500 dark:text-black dark:hover:bg-amber-600">
              <Link to="/about">{t('about_mini_button', 'Batafsil')}</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutMini; 