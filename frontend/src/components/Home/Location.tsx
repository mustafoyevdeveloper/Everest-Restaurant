import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MapPin, Clock } from 'lucide-react';

const Location = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 sm:py-32 bg-slate-50 dark:bg-slate-800/50 overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-800 dark:text-white mb-4">
            {t('location_title', 'Manzilimiz')}
          </h2>
          <p className="text-lg text-slate-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('location_subtitle', 'Bizni topish oson. Sizni kutamiz!')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="overflow-hidden rounded-lg shadow-2xl h-96"
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2996.837319875153!2d69.2447228153929!3d41.31108127927117!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38ae8b438b438b43%3A0x38ae8b438b438b43!2sTashkent%2C%20Uzbekistan!5e0!3m2!1sen!2s!4v1628620173645!5m2!1sen!2s"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              title="Everest Restaurant Location"
            ></iframe>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center md:text-left"
          >
            <div className="flex items-center justify-center md:justify-start mb-4">
              <MapPin className="w-6 h-6 mr-3 text-amber-500" />
              <p className="text-lg text-slate-800 dark:text-white font-semibold">
                {t('address_value', "Toshkent sh., Amir Temur ko'chasi, 100-uy")}
              </p>
            </div>
            <div className="flex items-center justify-center md:justify-start">
              <Clock className="w-6 h-6 mr-3 text-amber-500" />
              <div>
                <p className="text-lg text-slate-800 dark:text-white font-semibold">
                  {t('location_hours_title', 'Ishlash vaqti')}
                </p>
                <p className="text-slate-600 dark:text-gray-400">
                  {t('location_hours_value', 'Har kuni: 05:00 — 22:00')}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Location; 