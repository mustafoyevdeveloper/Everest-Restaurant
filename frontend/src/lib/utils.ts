import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import i18n from '@/i18n';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Rasm URL ni to'g'ri ko'rsatish uchun utility funksiya
export function getImageUrl(imageUrl: string): string {
  if (!imageUrl) return '';
  
  // URL ni to'g'ridan-to'g'ri qaytaramiz
  return imageUrl;
}

// Status tarjima funksiyasi - barcha sahifalar uchun
export const getStatusText = (status: string) => {
  const currentLanguage = i18n.language;
  
  switch (status.toLowerCase()) {
    // Buyurtmalar uchun
    case 'pending':
      return currentLanguage === 'ru' ? 'В ожидании' : 
             currentLanguage === 'uz' ? 'Kutilmoqda' : 'Pending';
    case 'confirmed':
      return currentLanguage === 'ru' ? 'Подтверждено' : 
             currentLanguage === 'uz' ? 'Tasdiqlangan' : 'Confirmed';
    case 'processing':
      return currentLanguage === 'ru' ? 'В обработке' : 
             currentLanguage === 'uz' ? 'Jarayonda' : 'Processing';
    case 'preparing':
      return currentLanguage === 'ru' ? 'Готовится' : 
             currentLanguage === 'uz' ? 'Tayyorlanmoqda' : 'Preparing';
    case 'ready':
      return currentLanguage === 'ru' ? 'Готово' : 
             currentLanguage === 'uz' ? 'Tayyor' : 'Ready';
    case 'shipped':
      return currentLanguage === 'ru' ? 'Отправлено' : 
             currentLanguage === 'uz' ? 'Yuborildi' : 'Shipped';
    case 'outfordelivery':
      return currentLanguage === 'ru' ? 'Доставляется' : 
             currentLanguage === 'uz' ? 'Yetkazib berilmoqda' : 'Out for Delivery';
    case 'delivered':
      return currentLanguage === 'ru' ? 'Доставлено' : 
             currentLanguage === 'uz' ? 'Yetkazildi' : 'Delivered';
    case 'cancelled':
      return currentLanguage === 'ru' ? 'Отменено' : 
             currentLanguage === 'uz' ? 'Bekor qilindi' : 'Cancelled';
    
    // Rezervatsiyalar uchun
    case 'seated':
      return currentLanguage === 'ru' ? 'Сидят' : 
             currentLanguage === 'uz' ? 'O\'tirgan' : 'Seated';
    case 'noshow':
      return currentLanguage === 'ru' ? 'Не явился' : 
             currentLanguage === 'uz' ? 'Kelmay qoldi' : 'No Show';
    
    // To'lovlar uchun
    case 'payment_completed':
      return currentLanguage === 'ru' ? 'Оплачено' : 
             currentLanguage === 'uz' ? 'To\'landi' : 'Completed';
    case 'failed':
      return currentLanguage === 'ru' ? 'Ошибка' : 
             currentLanguage === 'uz' ? 'Xatolik' : 'Failed';
    case 'refunded':
      return currentLanguage === 'ru' ? 'Возвращено' : 
             currentLanguage === 'uz' ? 'Qaytarilgan' : 'Refunded';
    
    // Xabarlar uchun
    case 'new':
      return currentLanguage === 'ru' ? 'Новое' : 
             currentLanguage === 'uz' ? 'Yangi' : 'New';
    case 'read':
      return currentLanguage === 'ru' ? 'Прочитано' : 
             currentLanguage === 'uz' ? 'O\'qildi' : 'Read';
    case 'replied':
      return currentLanguage === 'ru' ? 'Ответили' : 
             currentLanguage === 'uz' ? 'Javob berildi' : 'Replied';
    
    // Foydalanuvchilar uchun
    case 'active':
      return currentLanguage === 'ru' ? 'Активный' : 
             currentLanguage === 'uz' ? 'Faol' : 'Active';
    case 'inactive':
      return currentLanguage === 'ru' ? 'Неактивный' : 
             currentLanguage === 'uz' ? 'Faol emas' : 'Inactive';
    
    // Umumiy completed - kontekstga qarab
    case 'completed':
      // Bu yerda kontekstni aniqlash uchun qo'shimcha logika kerak
      // Hozircha rezervatsiyalar uchun deb hisoblaymiz
      return currentLanguage === 'ru' ? 'Завершено' : 
             currentLanguage === 'uz' ? 'Bajarilgan' : 'Completed';
    
    default:
      return status;
  }
};

// Admin panel uchun status tarjima funksiyasi - har doim o'zbek tilida
export const getAdminStatusText = (status: string) => {
  // Normalize status key (e.g. Pending -> pending)
  const key = status.replace(/([A-Z])/g, '_$1').replace(/^_/, '').toLowerCase();
  // Try orders, reservations, payments, messages
  const statusKeys = [
    `admin.orders.status_${key}`,
    `admin.reservations.status_${key}`,
    `admin.payments.status_${key}`,
    `admin.messages.status_${key}`,
    `admin_status_${key}`,
    `payment_status_${key}`
  ];
  for (const k of statusKeys) {
    const translated = i18n.t(k);
    if (translated && translated !== k) return translated;
  }
  // Fallback to Uzbek if available
  const uz = i18n.getResource('uz', 'translation', statusKeys[0]);
  if (uz) return uz;
  // Fallback to status itself
  return status;
};
