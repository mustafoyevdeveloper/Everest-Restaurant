import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import uzTranslation from './locales/uz/translation.json';
import ruTranslation from './locales/ru/translation.json';
import enTranslation from './locales/en/translation.json';

const resources = {
  uz: {
    translation: uzTranslation
  },
  ru: {
    translation: ruTranslation
  },
  en: {
    translation: enTranslation
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'uz',
    debug: false,
    
    // Rus tilini to'g'ri aniqlash uchun
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    
    // Rus tilini to'g'ri ishlash uchun
    supportedLngs: ['uz', 'ru', 'en'],
    nonExplicitSupportedLngs: true,
    
    interpolation: {
      escapeValue: false,
    },
    
    // Rus tilini to'g'ri aniqlash uchun qo'shimcha sozlamalar
    react: {
      useSuspense: false,
    },
  });

// Rus tilini to'g'ri aniqlash uchun qo'shimcha funksiya
const normalizeLanguage = (lang: string) => {
  if (lang.startsWith('ru')) return 'ru';
  if (lang.startsWith('uz')) return 'uz';
  if (lang.startsWith('en')) return 'en';
  return 'uz'; // default
};

// i18n ready bo'lganda tilni to'g'rilash
i18n.on('initialized', () => {
  const currentLang = i18n.language;
  const normalizedLang = normalizeLanguage(currentLang);
  
  if (currentLang !== normalizedLang) {
    i18n.changeLanguage(normalizedLang);
    }
  });

export default i18n; 