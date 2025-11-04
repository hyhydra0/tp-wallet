/**
 * Localization utility for detecting user's region and locale
 */

import { Language } from '../locales'

// Comprehensive locale to region mapping
interface LocaleData {
  language: string
  region: string
  displayName: string
}

const localeData: Record<string, LocaleData> = {
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

// Timezone to country mapping - Comprehensive list
const timezoneCountryMap: Record<string, string> = {
  // Americas
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Los_Angeles': 'US',
  'America/Denver': 'US',
  'America/Phoenix': 'US',
  'America/Anchorage': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Montreal': 'CA',
  'America/Mexico_City': 'MX',
  'America/Sao_Paulo': 'BR',
  'America/Buenos_Aires': 'AR',
  'America/Santiago': 'CL',
  'America/Bogota': 'CO',
  'America/Lima': 'PE',
  'America/Caracas': 'VE',

  // Europe
  'Europe/London': 'GB',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Munich': 'DE',
  'Europe/Hamburg': 'DE',
  'Europe/Frankfurt': 'DE',
  'Europe/Cologne': 'DE',
  'Europe/Stuttgart': 'DE',
  'Europe/Dusseldorf': 'DE',
  'Europe/Dortmund': 'DE',
  'Europe/Essen': 'DE',
  'Europe/Leipzig': 'DE',
  'Europe/Bremen': 'DE',
  'Europe/Dresden': 'DE',
  'Europe/Hanover': 'DE',
  'Europe/Nuremberg': 'DE',
  'Europe/Duisburg': 'DE',
  'Europe/Bochum': 'DE',
  'Europe/Wuppertal': 'DE',
  'Europe/Bielefeld': 'DE',
  'Europe/Bonn': 'DE',
  'Europe/Mannheim': 'DE',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Amsterdam': 'NL',
  'Europe/Brussels': 'BE',
  'Europe/Vienna': 'AT',
  'Europe/Zurich': 'CH',
  'Europe/Prague': 'CZ',
  'Europe/Warsaw': 'PL',
  'Europe/Budapest': 'HU',
  'Europe/Athens': 'GR',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Europe/Helsinki': 'FI',
  'Europe/Dublin': 'IE',
  'Europe/Lisbon': 'PT',
  'Europe/Moscow': 'RU',
  'Europe/Istanbul': 'TR',
  'Europe/Kiev': 'UA',

  // Asia
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Shanghai': 'CN',
  'Asia/Beijing': 'CN',
  'Asia/Hong_Kong': 'HK',
  'Asia/Taipei': 'TW',
  'Asia/Singapore': 'SG',
  'Asia/Bangkok': 'TH',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Jakarta': 'ID',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Manila': 'PH',
  'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA',
  'Asia/Kolkata': 'IN',
  'Asia/Mumbai': 'IN',
  'Asia/Delhi': 'IN',
  'Asia/Karachi': 'PK',
  'Asia/Dhaka': 'BD',
  'Asia/Tehran': 'IR',
  'Asia/Baghdad': 'IQ',
  'Asia/Jerusalem': 'IL',

  // Oceania
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU',
  'Pacific/Auckland': 'NZ',

  // Africa
  'Africa/Cairo': 'EG',
  'Africa/Johannesburg': 'ZA',
  'Africa/Lagos': 'NG',
  'Africa/Nairobi': 'KE',
  'Africa/Casablanca': 'MA'
}

/**
 * Detect user's browser locale
 */
export function detectUserLocale(): Language {
  console.log('🔍 ===== LOCALE DETECTION START =====')
  console.log('🔍 navigator.language:', navigator.language)
  console.log('🔍 navigator.languages:', navigator.languages)

  // Try to get from navigator.language or navigator.languages array
  let browserLang = navigator.language || (navigator as any).userLanguage || 'en-US'

  // If navigator.languages is available, use the first one
  if (navigator.languages && navigator.languages.length > 0) {
    browserLang = navigator.languages[0]
    console.log('🔍 Using first language from navigator.languages:', browserLang)
  }

  // Normalize the language string (some browsers might have different formats)
  browserLang = browserLang.replace('_', '-')

  // If it's just a language code without region (e.g., "de"), add default region
  if (!browserLang.includes('-')) {
    const languageDefaults: Record<string, string> = {
      de: 'de-DE',
      en: 'en-US',
      zh: 'zh-CN',
      tw: 'zh-TW',
      ja: 'ja-JP',
      ko: 'ko-KR',
      fr: 'fr-FR',
      es: 'es-ES',
      ru: 'ru-RU',
      it: 'it-IT',
      pt: 'pt-BR',
      ar: 'ar-SA',
      th: 'th-TH',
      vi: 'vi-VN',
      nl: 'nl-NL',
      pl: 'pl-PL',
      tr: 'tr-TR',
      id: 'id-ID',
      ms: 'ms-MY'
    }
    const lang = browserLang.toLowerCase()
    if (languageDefaults[lang]) {
      browserLang = languageDefaults[lang]
      console.log('🔍 Added default region:', browserLang)
    } else {
      browserLang = 'en-US'
    }
  }

  // List of supported languages
  const supportedLocales: Language[] = [
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

  // Try exact match first
  const exactMatch = browserLang as Language
  if (supportedLocales.includes(exactMatch)) {
    console.log('✅ FINAL DETECTED LOCALE:', exactMatch)
    console.log('🔍 ===== LOCALE DETECTION END =====')
    return exactMatch
  }

  // Try to extract language and region codes
  const langParts = browserLang.split('-')
  const langCode = langParts[0].toLowerCase()
  const regionCode = langParts[1]?.toUpperCase() || ''

  // Map language codes to default or region-specific locales
  const langDefaults: Record<string, Language> = {
    'en': regionCode === 'GB' ? 'en-GB' : regionCode === 'CA' ? 'en-CA' : regionCode === 'AU' ? 'en-AU' : regionCode === 'IN' ? 'en-IN' : 'en-US',
    'zh': regionCode === 'TW' ? 'zh-TW' : regionCode === 'HK' ? 'zh-HK' : 'zh-CN',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'de': regionCode === 'AT' ? 'de-AT' : regionCode === 'CH' ? 'de-CH' : 'de-DE',
    'fr': regionCode === 'CA' ? 'fr-CA' : regionCode === 'BE' ? 'fr-BE' : 'fr-FR',
    'es': regionCode === 'MX' ? 'es-MX' : regionCode === 'AR' ? 'es-AR' : 'es-ES',
    'it': 'it-IT',
    'pt': regionCode === 'BR' ? 'pt-BR' : 'pt-PT',
    'ru': 'ru-RU',
    'ar': regionCode === 'AE' ? 'ar-AE' : 'ar-SA',
    'th': 'th-TH',
    'vi': 'vi-VN',
    'nl': 'nl-NL',
    'pl': 'pl-PL',
    'tr': 'tr-TR',
    'id': 'id-ID',
    'ms': 'ms-MY'
  }

  // Try to match by language code
  const detected = langDefaults[langCode]
  if (detected && supportedLocales.includes(detected)) {
    console.log('✅ FINAL DETECTED LOCALE:', detected)
    console.log('🔍 ===== LOCALE DETECTION END =====')
    return detected
  }

  // Final fallback
  console.log('✅ FINAL DETECTED LOCALE: en-US (fallback)')
  console.log('🔍 ===== LOCALE DETECTION END =====')
  return 'en-US'
}

/**
 * Get locale data based on locale string
 */
export function getLocaleData(locale: string): LocaleData {
  // Try exact match first
  if (localeData[locale]) {
    return localeData[locale]
  }

  // Try language-only match (e.g., "en" from "en-US")
  const language = locale.split('-')[0]
  const defaultLocale = Object.values(localeData).find(l => l.language === language)

  if (defaultLocale) {
    return defaultLocale
  }

  // Default to English (US)
  return localeData['en-US']
}

/**
 * Detect user's region based on IP address geolocation - Most accurate method
 */
export async function detectUserRegion(): Promise<string> {
  try {
    console.log('🌍 ===== REGION DETECTION DEBUG =====')

    // METHOD 1: IP-based Geolocation (MOST ACCURATE - Shows actual physical location)
    try {
      console.log('🔍 Attempting IP geolocation...')

      // Try multiple free IP geolocation services for reliability
      const geoServices = [
        // Service 1: ipapi.co (no API key needed, 1000 requests/day)
        async () => {
          const response = await fetch('https://ipapi.co/json/', {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(5000)
          })
          const data = await response.json()
          return data.country_code
        },

        // Service 2: ip-api.com (no API key needed, good fallback)
        async () => {
          const response = await fetch('http://ip-api.com/json/', {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
          })
          const data = await response.json()
          return data.countryCode
        },

        // Service 3: ipinfo.io (no API key for basic usage)
        async () => {
          const response = await fetch('https://ipinfo.io/json', {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
          })
          const data = await response.json()
          return data.country
        }
      ]

      // Try services one by one until one succeeds
      for (let i = 0; i < geoServices.length; i++) {
        try {
          const countryCode = await geoServices[i]()

          if (countryCode && countryCode.length === 2) {
            const upperCode = countryCode.toUpperCase()
            console.log(
              '✅ METHOD 1 SUCCESS (IP Geolocation - Service ' + (i + 1) + '): ' + upperCode
            )
            console.log('🎯 FINAL DETECTED REGION: ' + upperCode)
            return upperCode
          }
        } catch (serviceError) {
          console.log('⚠️ Geolocation service ' + (i + 1) + ' failed:', serviceError)
          continue
        }
      }

      console.log('⚠️ All IP geolocation services failed, trying fallback methods...')
    } catch (e) {
      console.log('⚠️ Method 1 (IP Geo) error:', e)
    }

    // METHOD 2: Use Intl.DateTimeFormat to get the region (FALLBACK)
    try {
      const formatter = new Intl.DateTimeFormat()
      const options = formatter.resolvedOptions()

      console.log('🔍 Intl.DateTimeFormat resolved options:', options)

      // Try to extract country from locale
      if (options.locale) {
        const localeParts = options.locale.split('-')
        console.log('🔍 Intl locale parts:', localeParts)

        if (localeParts.length > 1) {
          const countryCode = localeParts[localeParts.length - 1].toUpperCase()
          // Validate it's a 2-letter country code
          if (countryCode.length === 2 && /^[A-Z]{2}$/.test(countryCode)) {
            console.log('✅ METHOD 2 SUCCESS (Intl API): ' + countryCode)
            console.log('🎯 FINAL DETECTED REGION: ' + countryCode)
            return countryCode
          }
        }
      }
    } catch (e) {
      console.log('⚠️ Method 2 error:', e)
    }

    // METHOD 3: Parse timezone to get region (FALLBACK)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    console.log('⏰ Timezone:', timezone)

    if (timezone) {
      // Try direct mapping first
      if (timezoneCountryMap[timezone]) {
        const countryCode = timezoneCountryMap[timezone]
        console.log('✅ METHOD 3 SUCCESS (Timezone mapping): ' + countryCode + ' from ' + timezone)
        console.log('🎯 FINAL DETECTED REGION: ' + countryCode)
        return countryCode
      }

      // Try to parse timezone (e.g., "Europe/Berlin" -> "DE")
      const timezoneParts = timezone.split('/')
      if (timezoneParts.length >= 2) {
        const city = timezoneParts[1]

        // Map major cities to countries
        const cityToCountry: Record<string, string> = {
          Berlin: 'DE',
          Paris: 'FR',
          London: 'GB',
          Rome: 'IT',
          Madrid: 'ES',
          Amsterdam: 'NL',
          Brussels: 'BE',
          Vienna: 'AT',
          Zurich: 'CH',
          Prague: 'CZ',
          Warsaw: 'PL',
          Budapest: 'HU',
          Athens: 'GR',
          Stockholm: 'SE',
          Oslo: 'NO',
          Copenhagen: 'DK',
          Helsinki: 'FI',
          Dublin: 'IE',
          Lisbon: 'PT',
          Moscow: 'RU',
          Istanbul: 'TR',
          Kiev: 'UA',
          Tokyo: 'JP',
          Seoul: 'KR',
          Shanghai: 'CN',
          Beijing: 'CN',
          Hong_Kong: 'HK',
          Taipei: 'TW',
          Singapore: 'SG',
          Bangkok: 'TH',
          Ho_Chi_Minh: 'VN',
          Jakarta: 'ID',
          Kuala_Lumpur: 'MY',
          Manila: 'PH',
          Dubai: 'AE',
          Riyadh: 'SA',
          Kolkata: 'IN',
          Mumbai: 'IN',
          Delhi: 'IN'
        }

        if (cityToCountry[city]) {
          const countryCode = cityToCountry[city]
          console.log('✅ METHOD 3 SUCCESS (City parsing): ' + countryCode + ' from city ' + city)
          console.log('🎯 FINAL DETECTED REGION: ' + countryCode)
          return countryCode
        }
      }
    }

    // METHOD 4: Check navigator.languages for region codes
    console.log('🌐 Navigator languages:', navigator.languages)
    if (navigator.languages && navigator.languages.length > 0) {
      for (const lang of navigator.languages) {
        const parts = lang.split('-')
        if (parts.length > 1) {
          const countryCode = parts[parts.length - 1].toUpperCase()
          if (countryCode.length === 2 && /^[A-Z]{2}$/.test(countryCode)) {
            console.log(
              '✅ METHOD 4 SUCCESS (navigator.languages): ' + countryCode + ' from ' + lang
            )
            console.log('🎯 FINAL DETECTED REGION: ' + countryCode)
            return countryCode
          }
        }
      }
      console.log('⚠️ Method 4: No valid region in navigator.languages')
    }

    // METHOD 5: Default fallback to US
    console.log('⚠️ ALL METHODS FAILED - Using default: US')
    console.log('🎯 FINAL DETECTED REGION: US')
    return 'US'
  } catch (error) {
    console.error('❌ Region detection failed with error:', error)
    return 'US'
  }
}

