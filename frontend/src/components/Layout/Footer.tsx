import React from 'react';
import { MapPin, Phone, Mail, Clock, Heart, Facebook, Instagram, Twitter, Send } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const socialLinks = [
  { 
    name: 'Facebook', 
    url: 'https://facebook.com/everestrestaurant',
    icon: Facebook
  },
  { 
    name: 'Instagram', 
    url: 'https://instagram.com/everestrestaurant',
    icon: Instagram
  },
  { 
    name: 'Twitter', 
    url: 'https://twitter.com/everestrest',
    icon: Twitter
  },
  { 
    name: 'Telegram', 
    url: 'https://t.me/everestrestaurant',
    icon: Send
  },
];

const Footer = () => {
  const { t } = useTranslation();
  const location = useLocation();
  
  const quickLinks = [
    { name: t('footer_link_menu'), to: '/menu' },
    { name: t('footer_link_reservations'), to: '/reservations' },
    { name: t('nav_contact'), to: '/contact' },
    { name: t('nav_about'), to: '/about' },
  ];

  return (
    <footer
      className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-white/10"
      style={{ paddingBottom: 24 }} 
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-slate-900 font-display font-bold text-xl">E</span>
              </div>
              <div>
                <span className="font-display text-2xl font-bold gradient-text">{t('footer_brand_name')}</span>
                <p className="text-xs text-slate-500 dark:text-gray-400 -mt-1">{t('footer_brand_tagline')}</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-gray-400 mb-6 max-w-md leading-relaxed">
              {t('footer_description')}
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-slate-200 dark:bg-white/5 rounded-lg flex items-center justify-center text-slate-600 dark:text-white hover:bg-yellow-400 hover:text-slate-900 transition-all duration-200"
                    aria-label={social.name}
                  >
                    <IconComponent className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-display text-xl font-semibold gradient-text mb-6">{t('footer_contact_title')}</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-yellow-400 mt-1" />
                <div>
                  <p className="text-slate-800 dark:text-white font-medium">{t('footer_address_title')}</p>
                  <p className="text-slate-500 dark:text-gray-400 text-sm" dangerouslySetInnerHTML={{ __html: t('footer_address_value') }}></p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-yellow-400 mt-1" />
                <div>
                  <p className="text-slate-800 dark:text-white font-medium">{t('footer_phone_title')}</p>
                  <p className="text-slate-500 dark:text-gray-400 text-sm">+998(50)515-17-00</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-yellow-400 mt-1" />
                <div>
                  <p className="text-slate-800 dark:text-white font-medium">{t('footer_email_title')}</p>
                  <p className="text-slate-500 dark:text-gray-400 text-sm">mustafoyev7788@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hours & Links */}
          <div>
            <h3 className="font-display text-xl font-semibold gradient-text mb-6">{t('footer_hours_title')}</h3>
            <div className="space-y-3 mb-8">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-slate-800 dark:text-white text-sm">{t('footer_hours_mon_thu')}</span>
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-sm ml-6">5:00 PM - 22:00 PM</p>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-slate-800 dark:text-white text-sm">{t('footer_hours_fri_sun')}</span>
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-sm ml-6">5:00 PM - 00:00 PM</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-slate-800 dark:text-white font-medium mb-3">{t('footer_quick_links_title')}</h4>
              {quickLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.to}
                  className={`block transition-colors duration-200 text-sm ${
                    location.pathname === link.to 
                      ? 'text-yellow-500 dark:text-yellow-400' 
                      : 'text-slate-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 dark:border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-500 dark:text-gray-400 text-sm mb-4 md:mb-0">
            {t('footer_copyright')} | 
            <Link 
              to="/privacy-policy" 
              className={`transition-colors duration-200 ${
                location.pathname === '/privacy-policy' 
                  ? 'text-yellow-500 dark:text-yellow-400' 
                  : 'hover:text-yellow-500 dark:hover:text-yellow-400'
              }`}
            >
              {t('footer_privacy_policy')}
            </Link> | 
            <Link 
              to="/contact" 
              className={`transition-colors duration-200 ${
                location.pathname === '/contact' 
                  ? 'text-yellow-500 dark:text-yellow-400' 
                  : 'hover:text-yellow-500 dark:hover:text-yellow-400'
              }`}
            >
              {t('nav_contact')}
            </Link> | 
            <Link 
              to="/terms-of-service" 
              className={`transition-colors duration-200 ${
                location.pathname === '/terms-of-service' 
                  ? 'text-yellow-500 dark:text-yellow-400' 
                  : 'hover:text-yellow-500 dark:hover:text-yellow-400'
              }`}
            >
              {t('footer_terms')}
            </Link>
          </p>
          <div className="flex items-center space-x-2 text-slate-500 dark:text-gray-400 text-sm">
            <span>{t('footer_by')}</span>
            <span>{t('footer_made_with')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
