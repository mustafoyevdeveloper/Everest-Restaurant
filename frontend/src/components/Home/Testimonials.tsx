import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Star, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Testimonials = () => {
  const { t } = useTranslation();

  const testimonials = [
    {
      name: 'Aziz Aliyev',
      role: t('testimonial_role_1', 'Doimiy mijoz'),
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      rating: 5,
      quote: t('testimonial_quote_1', "Bu yerda har bir taom san'at asari! Xizmat a'lo darajada va muhit shunchaki maftunkor. Albatta yana qaytaman!"),
    },
    {
      name: 'Nigora Karimova',
      role: t('testimonial_role_2', 'Birinchi tashrif'),
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      rating: 5,
      quote: t('testimonial_quote_2', "Kechki ovqat uchun ajoyib joy. Romantik muhit va mazali taomlar. Ayniqsa, steyklari og'izda erib ketadi."),
    },
    {
      name: 'Sardor Ismoilov',
      role: t('testimonial_role_3', 'Oila davrasida'),
      avatar: 'https://randomuser.me/api/portraits/men/56.jpg',
      rating: 4,
      quote: t('testimonial_quote_3', 'Oila bilan tushlik qilish uchun keldik. Bolalar uchun alohida menyu borligi juda yoqdi. Hammaga tavsiya qilaman!'),
    },
  ];
  
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.2,
        duration: 0.6,
        ease: 'easeOut',
      },
    }),
  };


  return (
    <section className="py-20 sm:py-32 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-800 dark:text-white mb-4">
            {t('testimonials_title', 'Mijozlarimiz Fikri')}
          </h2>
          <p className="text-lg text-slate-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('testimonials_subtitle', 'Bizning mehmonlarimizning samimiy taassurotlari.')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
             <motion.div
              key={i}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
            <Card className="h-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Avatar className="w-20 h-20 mb-4 border-4 border-white dark:border-slate-700 shadow-md">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback>
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <p className="text-slate-600 dark:text-gray-300 italic mb-4 flex-grow">"{testimonial.quote}"</p>
                <div className="flex items-center mb-2">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      className={`w-5 h-5 ${starIndex < testimonial.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                      fill="currentColor"
                    />
                  ))}
                </div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{testimonial.name}</h3>
                <p className="text-sm text-slate-500 dark:text-gray-400">{testimonial.role}</p>
              </CardContent>
            </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
