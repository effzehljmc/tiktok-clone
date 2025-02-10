import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from '@/i18n/de';
import en from '@/i18n/en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en
      },
      de: {
        translation: de
      }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export { useTranslation } from 'react-i18next';
export default i18n; 