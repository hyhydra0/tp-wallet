export interface LocaleData {
  language: string
  region: string
  displayName: string
}

export const localeData: Record<string, LocaleData> = {
  'en-US': { language: 'en', region: 'US', displayName: 'English (United States)' },
  'en-GB': { language: 'en', region: 'GB', displayName: 'English (United Kingdom)' },
  'en-CA': { language: 'en', region: 'CA', displayName: 'English (Canada)' },
  'en-AU': { language: 'en', region: 'AU', displayName: 'English (Australia)' },
  'en-IN': { language: 'en', region: 'IN', displayName: 'English (India)' },
  'zh-CN': { language: 'zh', region: 'CN', displayName: '简体中文' },
  'zh-TW': { language: 'tw', region: 'TW', displayName: '繁體中文' },
  'zh-HK': { language: 'tw', region: 'HK', displayName: '繁體中文（香港）' },
  'ja-JP': { language: 'ja', region: 'JP', displayName: '日本語' },
  'ko-KR': { language: 'ko', region: 'KR', displayName: '한국어' },
  'de-DE': { language: 'de', region: 'DE', displayName: 'Deutsch' },
  'de-AT': { language: 'de', region: 'AT', displayName: 'Deutsch (Österreich)' },
  'de-CH': { language: 'de', region: 'CH', displayName: 'Deutsch (Schweiz)' },
  'fr-FR': { language: 'fr', region: 'FR', displayName: 'Français' },
  'fr-CA': { language: 'fr', region: 'CA', displayName: 'Français (Canada)' },
  'fr-BE': { language: 'fr', region: 'BE', displayName: 'Français (Belgique)' },
  'es-ES': { language: 'es', region: 'ES', displayName: 'Español' },
  'es-MX': { language: 'es', region: 'MX', displayName: 'Español (México)' },
  'es-AR': { language: 'es', region: 'AR', displayName: 'Español (Argentina)' },
  'it-IT': { language: 'it', region: 'IT', displayName: 'Italiano' },
  'pt-BR': { language: 'pt', region: 'BR', displayName: 'Português (Brasil)' },
  'pt-PT': { language: 'pt', region: 'PT', displayName: 'Português (Portugal)' },
  'ru-RU': { language: 'ru', region: 'RU', displayName: 'Русский' },
  'ar-SA': { language: 'ar', region: 'SA', displayName: 'العربية' },
  'ar-AE': { language: 'ar', region: 'AE', displayName: 'العربية (الإمارات)' },
  'th-TH': { language: 'th', region: 'TH', displayName: 'ไทย' },
  'vi-VN': { language: 'vi', region: 'VN', displayName: 'Tiếng Việt' },
  'nl-NL': { language: 'nl', region: 'NL', displayName: 'Nederlands' },
  'pl-PL': { language: 'pl', region: 'PL', displayName: 'Polski' },
  'tr-TR': { language: 'tr', region: 'TR', displayName: 'Türkçe' },
  'id-ID': { language: 'id', region: 'ID', displayName: 'Bahasa Indonesia' },
  'ms-MY': { language: 'ms', region: 'MY', displayName: 'Bahasa Melayu' }
}

