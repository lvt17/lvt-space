import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translations (we'll fetch them or import them directly)
// For simplicity in this environment, we'll define them here or import from JSON files
// But wait, the standard is to have them in public/locales or src/locales.
// I'll put them in src/locales for easier bundling if needed, or public/locales.
// Let's use src/locales/vi.json and src/locales/en.json for now to avoid static file issues.

import translationEN from './locales/en.json'
import translationVI from './locales/vi.json'

const resources = {
  en: {
    translation: translationEN
  },
  vi: {
    translation: translationVI
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'vi',
    debug: false,
    interpolation: {
      escapeValue: false // not needed for react as it escapes by default
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  })

export default i18n
