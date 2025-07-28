import React from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Hero = () => {
  const { t } = useTranslation();

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* YouTube Background Video */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <video
            src="/Home Video.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover pointer-events-none"
            style={{ aspectRatio: '16/9', background: 'black', maxWidth: '100vw' }}
          />
        </div>
      </div>

      {/* Gradient Overlay - only for dark mode */}
      <div className="absolute inset-0 bg-transparent dark:bg-black/70 z-10" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold mb-4 tracking-wider uppercase text-amber-400 px-4"
          style={{ textShadow: '0 0 16px #FFD700, 0 0 32px #FFD700, 0 2px 5px rgba(0,0,0,0.5)' }}
        >
          {t('hero_restaurant_name', 'Everest Restaurant')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="text-lg md:text-2xl max-w-3xl mb-8 font-light text-gray-200 px-4"
          style={{ textShadow: '0px 1px 4px rgba(0,0,0,0.5)' }}
        >
          {t('hero_restaurant_subtitle', 'Eng yaxshi taomlar va unutilmas muhitni kashf eting.')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <Button asChild size="lg" className="bg-slate-800 text-white hover:bg-slate-700 dark:bg-amber-500 dark:text-black dark:hover:bg-amber-600 font-bold text-lg px-8 py-6">
            <Link to="/menu">{t('hero_cta_menu', "Menyuni ko'rish")}</Link>
          </Button>
          <Button asChild size="lg"
            className="bg-white text-slate-900 shadow-md hover:bg-slate-900 hover:text-white dark:bg-transparent dark:text-white dark:hover:bg-white dark:hover:text-black font-bold text-lg px-8 py-6 transition-colors duration-300"
          >
            <Link to="/reservations">{t('hero_cta_reservation', 'Zaxira qilish')}</Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
