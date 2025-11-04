import { useState } from 'react'
import { Language, detectUserLocale } from '../locales'
import { localeData } from '../locales/constants'

/**
 * Map locale string to Language type (locale is already in en-US format)
 */
export const getLanguageFromLocale = (locale: string): Language => {
  // Validate that locale is a valid Language type
  const validLocales: Language[] = [
    'en-US', 'en-GB', 'en-CA', 'en-AU', 'en-IN',
    'zh-CN', 'zh-TW', 'zh-HK',
    'ja-JP', 'ko-KR',
    'de-DE', 'de-AT', 'de-CH',
    'fr-FR', 'fr-CA', 'fr-BE',
    'es-ES', 'es-MX', 'es-AR',
    'it-IT',
    'pt-BR', 'pt-PT',
    'ru-RU',
    'ar-SA', 'ar-AE',
    'th-TH', 'vi-VN',
    'nl-NL', 'pl-PL',
    'tr-TR', 'id-ID', 'ms-MY'
  ]
  
  if (validLocales.includes(locale as Language)) {
    return locale as Language
  }
  
  return 'en-US'
}

/**
 * Get all available locales for language selection
 */
export const getAvailableLocales = () => {
  return Object.entries(localeData)
}

/**
 * Custom hook to manage language state with browser detection
 * Language can be changed by user
 */
export const useLanguage = () => {
  const [lang, setLang] = useState<Language>(() => {
    // Initialize with browser language on first load
    const savedLang = localStorage.getItem('selectedLanguage') as Language | null
    if (savedLang && savedLang.match(/^[a-z]{2}-[A-Z]{2}$/)) {
      return savedLang
    }
    return detectUserLocale()
  })

  const changeLanguage = (newLang: Language) => {
    setLang(newLang)
    localStorage.setItem('selectedLanguage', newLang)
  }

  return { lang, changeLanguage }
}
