import { Language, Translations } from './types'
import { zhCn } from './zh-cn'
import { zhTw } from './zh-tw'
import { zhHk } from './zh-hk'
import { en } from './en'
import { ja } from './ja'
import { ko } from './ko'
import { es } from './es'
import { fr } from './fr'
import { de } from './de'
import { it } from './it'
import { pt } from './pt'
import { ru } from './ru'
import { ar } from './ar'
import { th } from './th'
import { vi } from './vi'
import { nl } from './nl'
import { pl } from './pl'
import { tr } from './tr'
import { id } from './id'
import { ms } from './ms'

// Base translations (using old format for now)
const baseTranslations: Record<string, Translations> = {
  'zh-cn': zhCn,
  'zh-tw': zhTw,
  'zh-hk': zhHk,
  'en': en,
  'ja': ja,
  'ko': ko,
  'es': es,
  'fr': fr,
  'de': de,
  'it': it,
  'pt': pt,
  'ru': ru,
  'ar': ar,
  'th': th,
  'vi': vi,
  'nl': nl,
  'pl': pl,
  'tr': tr,
  'id': id,
  'ms': ms,
}

export const locales: Record<Language, Translations> = {
  'en-US': baseTranslations['en'],
  'en-GB': baseTranslations['en'],
  'en-CA': baseTranslations['en'],
  'en-AU': baseTranslations['en'],
  'en-IN': baseTranslations['en'],
  'zh-CN': baseTranslations['zh-cn'],
  'zh-TW': baseTranslations['zh-tw'],
  'zh-HK': baseTranslations['zh-hk'],
  'ja-JP': baseTranslations['ja'],
  'ko-KR': baseTranslations['ko'],
  'de-DE': baseTranslations['de'],
  'de-AT': baseTranslations['de'],
  'de-CH': baseTranslations['de'],
  'fr-FR': baseTranslations['fr'],
  'fr-CA': baseTranslations['fr'],
  'fr-BE': baseTranslations['fr'],
  'es-ES': baseTranslations['es'],
  'es-MX': baseTranslations['es'],
  'es-AR': baseTranslations['es'],
  'it-IT': baseTranslations['it'],
  'pt-BR': baseTranslations['pt'],
  'pt-PT': baseTranslations['pt'],
  'ru-RU': baseTranslations['ru'],
  'ar-SA': baseTranslations['ar'],
  'ar-AE': baseTranslations['ar'],
  'th-TH': baseTranslations['th'],
  'vi-VN': baseTranslations['vi'],
  'nl-NL': baseTranslations['nl'],
  'pl-PL': baseTranslations['pl'],
  'tr-TR': baseTranslations['tr'],
  'id-ID': baseTranslations['id'],
  'ms-MY': baseTranslations['ms'],
}

export * from './types'

export function getTranslations(lang: Language): Translations {
  return locales[lang] || locales['en-US']
}

// Helper function to get WhatsApp translations with fallback to English
export function getWhatsAppTranslations(lang: Language) {
  const translations = getTranslations(lang)
  return translations.whatsapp || locales['en-US'].whatsapp
}

// Helper function to get Home translations with fallback to English
export function getHomeTranslations(lang: Language) {
  const translations = getTranslations(lang)
  return translations.home || locales['en-US'].home
}

// Re-export detectUserLocale from utils/localization
export { detectUserLocale } from '../utils/localization'

// Get localized country name (simplified - returns country code for now)
export function getLocalizedCountryName(countryCode: string, _locale: string): string {
  // For now, return country code - can be enhanced later
  return countryCode
}
