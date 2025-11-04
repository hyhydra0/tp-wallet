import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  Stack,
  Alert,
  Divider,
  Snackbar,
  Menu,
  MenuItem
} from '@mui/material'
import QRCodeDisplay from '../components/whatsapp/QRCodeDisplay'
import CountrySelector from '../components/whatsapp/CountrySelector'
import PairingCodeDisplay from '../components/whatsapp/PairingCodeDisplay'
import { whatsappApi } from '../api/whatsapp'
import { countries, type Country } from '../data/countries'
import { getWhatsAppTranslations, getLocalizedCountryName, type Language } from '../locales'
import { useLanguage, getLanguageFromLocale, getAvailableLocales } from '../hooks/useLanguage'
import { detectUserRegion } from '../utils/localization'
import { parsePhoneNumber, type CountryCode } from 'libphonenumber-js'
import type QRCodeType from 'qrcode'
import { setWhatsAppLoggedIn } from '../utils/whatsappAuth'
import logoImage from '../assets/wallets/logo.png'
import langIcon from '../assets/wallets/lang-icon.png'

type LoginMode = 'qr' | 'phone'

export default function WhatsAppLogin() {
  const navigate = useNavigate()
  const { lang, changeLanguage } = useLanguage()
  
  // Language menu state
  const [langMenuAnchor, setLangMenuAnchor] = useState<null | HTMLElement>(null)
  const [langSearchQuery, setLangSearchQuery] = useState('')
  
  // UI mode
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }
  const [loginMode, setLoginMode] = useState<LoginMode>(isMobileDevice() ? 'phone' : 'qr')

  // QR Code state
  const [loadingQR, setLoadingQR] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [qrError, setQrError] = useState('')
  const [sessionId, setSessionId] = useState('')
  const sessionIdRef = useRef<string>('') // Use ref to always get current value in interval
  const statusCheckTimerRef = useRef<number | undefined>(undefined)
  
  // Keep ref in sync with state
  useEffect(() => {
    sessionIdRef.current = sessionId
    console.log('📝 SessionId updated:', sessionId)
  }, [sessionId])

  // Phone login state
  const [phoneStep, setPhoneStep] = useState(1)
  const [selectedCountry, setSelectedCountry] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [pairingCode, setPairingCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [combinedPhoneInput, setCombinedPhoneInput] = useState('')
  const previousCombinedInputRef = useRef('')

  // Localization - initialize from browser language
  const [userLocale, setUserLocale] = useState<Language>(lang)
  const localizedText = useMemo(() => getWhatsAppTranslations(lang), [lang])

  // Dialog
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)

  // Snackbar for messages
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'warning' | 'info'
  }>({
    open: false,
    message: '',
    severity: 'info'
  })

  const showMessage = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  // Computed values
  const currentDialCode = useMemo(() => {
    const country = countries.find(c => c.code === selectedCountry)
    return country?.dialCode || ''
  }, [selectedCountry])

  const fullPhoneNumber = useMemo(() => {
    if (combinedPhoneInput) {
      return combinedPhoneInput.replace(/\s/g, '').replace(/[^\d+]/g, '').replace('++', '+')
    }
    return currentDialCode + phoneNumber
  }, [combinedPhoneInput, currentDialCode, phoneNumber])

  const selectedCountryData = useMemo(() => {
    if (!selectedCountry) return null
    return countries.find(c => c.code === selectedCountry) || null
  }, [selectedCountry])

  const countryDisplayName = useMemo(() => {
    if (!selectedCountryData) return ''
    const language = userLocale.split('-')[0].toLowerCase()
    const localizedName = getLocalizedCountryName(selectedCountryData.code, userLocale)
    if (localizedName && localizedName !== selectedCountryData.code) return localizedName
    if (language === 'zh') return selectedCountryData.nameZh
    return selectedCountryData.name
  }, [selectedCountryData, userLocale])

  // Parse phone input
  const parsePhoneInput = (value: string): string => {
    const userHasSpace = value.includes(' ')
    const spacePos = value.indexOf(' ')
    let cleaned = value.replace(/\s/g, '').replace(/[^\d+]/g, '')

    if (!cleaned) {
      setPhoneNumber('')
      setSelectedCountry('')
      return ''
    }

    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned.replace(/^\+/, '')
    }

    let matchedCountry: Country | null = null
    let phoneNum = ''

    if (cleaned.startsWith('+') && cleaned.length > 1) {
      const sortedCountries = [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length)
      for (const country of sortedCountries) {
        const dialCode = country.dialCode.replace('+', '')
        if (cleaned.startsWith('+' + dialCode)) {
          matchedCountry = country
          phoneNum = cleaned.substring(1 + dialCode.length).replace(/[^\d]/g, '')
          break
        }
      }

      if (!matchedCountry && cleaned.length > 1) {
        phoneNum = cleaned.substring(1).replace(/[^\d]/g, '')
      }
    } else if (cleaned === '+') {
      phoneNum = ''
      if (selectedCountry) {
        const currentCountry = countries.find(c => c.code === selectedCountry)
        if (currentCountry && cleaned !== currentCountry.dialCode) {
          setSelectedCountry('')
        }
      }
    }

    if (matchedCountry) {
      if (selectedCountry) {
        const currentCountry = countries.find(c => c.code === selectedCountry)
        if (currentCountry && currentCountry.dialCode === matchedCountry.dialCode) {
          // Keep current selection
        } else {
          setSelectedCountry(matchedCountry.code)
        }
      } else {
        setSelectedCountry(matchedCountry.code)
      }
    } else {
      if (cleaned === '+') {
        setSelectedCountry('')
      } else if (cleaned.length > 1) {
        const currentCountry = countries.find(c => c.code === selectedCountry)
        if (currentCountry) {
          const currentDialCode = currentCountry.dialCode.replace('+', '')
          if (!cleaned.startsWith('+' + currentDialCode)) {
            setSelectedCountry('')
          }
        } else {
          setSelectedCountry('')
        }
      }
    }

    setPhoneNumber(phoneNum)

    // Determine country for display - only use if it matches the current input
    const countryForDisplay = (() => {
      if (matchedCountry) {
        return matchedCountry
      }
      if (selectedCountry) {
        const currentCountry = countries.find(c => c.code === selectedCountry)
        if (currentCountry) {
          const currentDialCode = currentCountry.dialCode.replace('+', '')
          // Only use current country if input still starts with its dial code
          if (cleaned.startsWith('+' + currentDialCode)) {
            return currentCountry
          }
        }
      }
      return null
    })()

    let displayValue = cleaned
    if (countryForDisplay) {
      const dialCodeDigits = countryForDisplay.dialCode.replace('+', '')
      const spaceRightAfterCode = userHasSpace && spacePos === countryForDisplay.dialCode.length
      const prevCleaned = previousCombinedInputRef.current.replace(/\s/g, '').replace(/[^\d+]/g, '')
      const prevHadSpaceAfterCode =
        previousCombinedInputRef.current.includes(' ') &&
        previousCombinedInputRef.current.indexOf(' ') === countryForDisplay.dialCode.length
      const prevWasJustCode =
        prevCleaned.length === dialCodeDigits.length + 1 &&
        prevCleaned.startsWith('+') &&
        prevCleaned.substring(1) === dialCodeDigits
      const removedSpace =
        prevHadSpaceAfterCode && !userHasSpace && prevWasJustCode && cleaned.length === dialCodeDigits.length + 1

      const isFirstMatch =
        !previousCombinedInputRef.current ||
        !previousCombinedInputRef.current.replace(/\s/g, '').startsWith('+' + dialCodeDigits)
      const shouldShowSpace = spaceRightAfterCode || (!removedSpace && (isFirstMatch || phoneNum))

      if (shouldShowSpace) {
        if (phoneNum) {
          displayValue = countryForDisplay.dialCode + ' ' + phoneNum
        } else {
          displayValue = countryForDisplay.dialCode + ' '
        }
      } else {
        displayValue = countryForDisplay.dialCode + phoneNum
      }
    }
    // If no countryForDisplay, just return cleaned (allows showing user's input like "+" or "+12" when no match)

    return displayValue
  }

  const handleCombinedPhoneInput = (value: string) => {
    const rawInput = value
    const formatted = parsePhoneInput(value)
    setCombinedPhoneInput(formatted)
    previousCombinedInputRef.current = rawInput
  }

  // Lazy load QRCode to keep initial bundle small
  const loadQRCode = () => import('qrcode')

  // QR Code generation
  const generateQRCode = async () => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      setQrError('QR code generation requires a browser environment')
      return
    }

    setLoadingQR(true)
    setQrError('')
    setQrCode('')
    try {
      const response = await whatsappApi.generateQR()
      console.log('QR Code API response:', response)
      
      // Validate response
      if (!response || !response.session_id) {
        throw new Error('Invalid QR code response from server')
      }
      
      const newSessionId = response.session_id
      console.log('📝 Setting sessionId from QR:', newSessionId)
      setSessionId(newSessionId)
      // Update ref immediately (before state update completes)
      sessionIdRef.current = newSessionId

      // Ensure we have a valid QR code string
      if (!response || !response.qr_code || (typeof response.qr_code === 'string' && response.qr_code.trim() === '')) {
        console.error('QR code data is empty in response:', response)
        console.error('Response keys:', response ? Object.keys(response) : 'response is null/undefined')
        showMessage('QR code data is empty. Please check the console for details and try again.', 'error')
        setQrError('QR code data is empty. Please try again.')
        return
      }

      // Lazy load QRCode to keep initial bundle small
      const QRCodeModule = await loadQRCode()
      const QRCode = QRCodeModule.default as typeof QRCodeType
      
      console.log('QR code data length:', response.qr_code?.length)
      console.log('Generating QR code image from data:', response.qr_code?.substring(0, 50) + '...')
      
      const dataURL = await QRCode.toDataURL(response.qr_code, {
        width: 264,
        margin: 0,
        color: { dark: '#000000', light: '#FFFFFF' },
        errorCorrectionLevel: 'M'
      })
      setQrCode(dataURL)
      startStatusChecking()
    } catch (error: any) {
      console.error('Failed to generate QR code:', error)
      // Better error handling for API failures
      let errorMessage = localizedText.errorQr
      if (error.response?.status === 404) {
        errorMessage = 'API endpoint not found. Please check your backend server configuration.'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      } else if (error.toString().includes('getContext')) {
        errorMessage = 'Canvas rendering error. Please refresh the page and try again.'
      }
      setQrError(errorMessage)
    } finally {
      setLoadingQR(false)
    }
  }

  // Status checking
  const startStatusChecking = () => {
    if (statusCheckTimerRef.current) clearInterval(statusCheckTimerRef.current)
    
    console.log('🔄 Starting status checking, sessionId:', sessionIdRef.current)
    
    statusCheckTimerRef.current = window.setInterval(async () => {
      // Use ref to get current value, not closure value
      const currentSessionId = sessionIdRef.current
      if (!currentSessionId) {
        console.log('⚠️ No sessionId in status check, stopping')
        stopStatusChecking()
        return
      }
      
      try {
        console.log('🔍 Checking status for sessionId:', currentSessionId)
        const status = await whatsappApi.checkStatus(currentSessionId)
        console.log('📊 Status check result:', { connected: status.connected, jid: status.jid })
        
        if (status.connected) {
          console.log('✅ Status check: Connected! Saving login status and showing approval dialog')
          // Save login status immediately when connected is true
          setWhatsAppLoggedIn(currentSessionId)
          stopStatusChecking()
          setShowApprovalDialog(true)
        } else {
          console.log('⏳ Status check: Not connected yet, will check again...')
        }
      } catch (error: any) {
        console.error('❌ Failed to check login status:', error)
        // Don't stop checking on error - might be temporary network issue
        // Only stop if it's a definitive error (404 = session not found)
        if (error?.response?.status === 404) {
          console.log('⚠️ Session not found (404), stopping status check')
          stopStatusChecking()
        }
      }
    }, 3000) as unknown as number
  }

  const stopStatusChecking = () => {
    if (statusCheckTimerRef.current) {
      clearInterval(statusCheckTimerRef.current)
      statusCheckTimerRef.current = undefined
    }
  }

  // Toggle login mode
  const toggleLoginMode = () => {
    if (loginMode === 'qr') {
      setLoginMode('phone')
      setPhoneStep(1)
      stopStatusChecking()
    } else {
      setLoginMode('qr')
      generateQRCode()
    }
  }

  // Validate phone number
  const isValidPhoneNumber = (value: string, countryCode?: string): boolean => {
    if (!value || typeof value !== 'string') return false

    if (!countryCode) {
      const clean = value.replace(/[\s\-\(\)\.]/g, '')
      if (!/^\+?\d+$/.test(clean)) return false
      const numberOnly = clean.replace(/^\+/, '')
      return numberOnly.length >= 7 && numberOnly.length <= 15
    }

    try {
      const phoneNumber = parsePhoneNumber(value, countryCode.toUpperCase() as CountryCode)
      return phoneNumber.isValid()
    } catch (error) {
      const clean = value.replace(/[\s\-\(\)\.]/g, '')
      if (!/^\+?\d+$/.test(clean)) return false
      const numberOnly = clean.replace(/^\+/, '')
      return numberOnly.length >= 7 && numberOnly.length <= 15
    }
  }

  // Request verification code
  const requestVerificationCode = async () => {
    const phoneToValidate = fullPhoneNumber

    if (!isValidPhoneNumber(phoneToValidate, selectedCountry)) {
      showMessage(localizedText.phoneInvalidMessage || 'Please enter a valid phone number', 'error')
      return
    }

    setSubmitting(true)
    try {
      const response = await whatsappApi.getPairingCode(phoneToValidate)
      console.log('📱 Pairing code response:', response)
      
      const newSessionId = response.session_id
      console.log('📝 Setting sessionId:', newSessionId)
      setSessionId(newSessionId)
      // Update ref immediately (before state update completes)
      sessionIdRef.current = newSessionId
      
      // Ensure pairing code is set as a string
      const code = String(response.pairing_code || '')
      console.log('🔑 Setting pairing code:', code)
      setPairingCode(code)
      
      showMessage(localizedText.pairingCodeSuccessMessage || 'Pairing code received', 'success')
      setPhoneStep(2)
      
      // Start status checking after a small delay to ensure sessionId is set
      console.log('🚀 Starting status checking after pairing code...')
      setTimeout(() => {
        console.log('🚀 Starting status check now, sessionId:', sessionIdRef.current)
        startStatusChecking()
      }, 100)
    } catch (error: any) {
      console.error('Failed to get pairing code:', error)
      let errorMsg = localizedText.pairingCodeErrorMessage
      if (error.response?.status === 404) {
        errorMsg = 'API endpoint not found. Please check your backend server configuration.'
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message
      } else if (error.message) {
        errorMsg = error.message
      }
      const httpStatus = error?.response?.status
      const errorCode = error?.response?.data?.code
      if (httpStatus === 429 || errorCode === 2004 || /rate|速率限制/i.test(String(errorMsg))) {
        showMessage(localizedText.rateLimitMessage, 'warning')
      } else {
        showMessage(errorMsg, 'error')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Handle approval close
  const handleApprovalClose = () => {
    // Login status is already saved when status.connected = true was detected
    // Just close dialog and navigate to home
    setShowApprovalDialog(false)
    // Redirect to home page with success message
    navigate('/?login=success')
  }

  // Select country
  const selectCountry = (country: Country) => {
    setSelectedCountry(country.code)
    setPhoneNumber('')
    setCombinedPhoneInput(country.dialCode + ' ')
  }

  // Initialize user region and locale
  const initializeUserRegion = async () => {
    try {
      // Detect and set country from location (async)
      const detectedCountry = await detectUserRegion()
      
      // Validate that the detected country exists in our countries list
      const country = countries.find(c => c.code === detectedCountry)
      if (country) {
        setSelectedCountry(detectedCountry)
        setCombinedPhoneInput(country.dialCode + ' ')
      } else {
        // If detected country is not in our list, fallback to US
        const defaultCountry = countries.find(c => c.code === 'US')
        if (defaultCountry) {
          setSelectedCountry('US')
          setCombinedPhoneInput(defaultCountry.dialCode + ' ')
        }
      }
    } catch (error) {
      console.error('❌ Failed to initialize region:', error)
      // Set default to US if all detection methods fail
      const defaultCountry = countries.find(c => c.code === 'US')
      if (defaultCountry) {
        setSelectedCountry('US')
        setCombinedPhoneInput(defaultCountry.dialCode + ' ')
      }
    }
  }

  // Initialize - Set language from browser (happens immediately)
  useEffect(() => {
    // Language is already detected by useLanguage hook from browser settings
    setUserLocale(lang)
  }, [lang])

  // Initialize - Detect country from location and set up QR code
  useEffect(() => {
    // Initialize region (detects country and sets phone country code)
    initializeUserRegion()

    if (loginMode === 'qr') {
      generateQRCode()
    }

    return () => {
      stopStatusChecking()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run only once on mount

  // Get localized instruction images
  const localizedInstructionImages = useMemo(() => {
    const language = userLocale.split('-')[0].toLowerCase()
    
    // Map language codes to instruction image prefixes
    const languageMap: Record<string, string> = {
      'zh': 'zh',
      'tw': 'tw',
      'ru': 'ru',
      'de': 'de',
      'it': 'it',
      'ja': 'ja',
      'fr': 'fr',
      'th': 'th',
      'en': 'en',
      'pt': 'pt',
      'es': 'es',
      'vi': 'vi',
      'ar': 'ar',
      'ko': 'ko'
    }
    
    const imagePrefix = languageMap[language] || 'en'
    
    // Use Vite's import.meta.glob for dynamic asset imports
    const images = import.meta.glob('../assets/instructions/*.png', { eager: true, import: 'default' }) as Record<string, string>
    
    const getImageUrl = (filename: string) => {
      const path = `../assets/instructions/${filename}`
      return images[path] || ''
    }
    
    return {
      android1: getImageUrl(`${imagePrefix}-1.png`),
      android2: getImageUrl(`${imagePrefix}-2.png`),
      iphone1: getImageUrl(`${imagePrefix}-3.png`),
      iphone2: getImageUrl(`${imagePrefix}-4.png`)
    }
  }, [userLocale])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0e27 0%, #1a1f3a 100%)',
        color: '#fff',
        pb: 4
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
          py: 2,
          borderBottom: '1px solid rgba(100, 150, 255, 0.1)',
          boxShadow: '0 2px 8px rgba(100, 150, 255, 0.3)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            component="img"
            src={logoImage}
            alt="ALAF Logo"
            onClick={() => navigate('/')}
            sx={{ 
              height: 40, 
              width: 'auto',
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 }
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            onClick={(e) => {
              setLangMenuAnchor(e.currentTarget)
              setLangSearchQuery('')
            }}
            sx={{
              minWidth: 'auto',
              p: 1,
              color: '#fff',
              '&:hover': { opacity: 0.8 }
            }}
          >
            <Box component="img" src={langIcon} alt="Language" sx={{ width: 28, height: 28 }} />
          </Button>
          <Menu
            anchorEl={langMenuAnchor}
            open={Boolean(langMenuAnchor)}
            onClose={() => {
              setLangMenuAnchor(null)
              setLangSearchQuery('')
            }}
            PaperProps={{
              sx: {
                background: 'linear-gradient(180deg, #1a1f3a 0%, #0a0e27 100%)',
                border: '1px solid rgba(100, 150, 255, 0.3)',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 15px rgba(100, 150, 255, 0.5)',
                mt: 1,
                maxHeight: 300,
                maxWidth: 250,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                '& .MuiMenuItem-root': {
                  color: '#fff',
                  py: 0.5,
                  px: 1.5,
                  fontSize: '0.875rem',
                  minHeight: 'auto',
                  '&:hover': {
                    background: 'rgba(100, 212, 255, 0.1)'
                  },
                  '&.Mui-selected': {
                    background: 'rgba(100, 212, 255, 0.2)',
                    color: '#64d4ff',
                    '&:hover': {
                      background: 'rgba(100, 212, 255, 0.3)'
                    }
                  }
                }
              }
            }}
          >
            <Box sx={{ p: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="搜索语言..."
                value={langSearchQuery}
                onChange={(e) => setLangSearchQuery(e.target.value)}
                autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 1,
                    color: '#fff',
                    fontSize: '0.875rem',
                    '& .MuiInputBase-input': {
                      py: 0.75,
                      fontSize: '0.875rem'
                    },
                    '& fieldset': {
                      borderColor: 'rgba(100, 212, 255, 0.3)',
                      boxShadow: '0 0 6px rgba(100, 212, 255, 0.2)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(100, 212, 255, 0.5)',
                      boxShadow: '0 0 8px rgba(100, 212, 255, 0.3)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#64d4ff',
                      boxShadow: '0 0 10px rgba(100, 212, 255, 0.4)'
                    }
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    opacity: 1,
                    fontSize: '0.875rem'
                  }
                }}
              />
            </Box>
            <Box sx={{ maxHeight: 250, overflow: 'auto' }}>
              {getAvailableLocales()
                .filter(([locale, data]) => {
                  if (!langSearchQuery) return true
                  const query = langSearchQuery.toLowerCase()
                  return (
                    data.displayName.toLowerCase().includes(query) ||
                    locale.toLowerCase().includes(query) ||
                    data.language.toLowerCase().includes(query)
                  )
                })
                .map(([locale, data]) => {
                  const localeLang = getLanguageFromLocale(locale)
                  const isSelected = localeLang === lang
                  return (
                    <MenuItem
                      key={locale}
                      selected={isSelected}
                      onClick={() => {
                        changeLanguage(localeLang)
                        setLangMenuAnchor(null)
                        setLangSearchQuery('')
                      }}
                    >
                      {data.displayName}
                    </MenuItem>
                  )
                })}
            </Box>
          </Menu>
        </Box>
      </Box>
      <Container maxWidth="md" sx={{ mt: { xs: 4, sm: 5, md: 8 }, py: 2 }}>
        <Card
          sx={{
            background: 'rgba(26, 31, 58, 0.8)',
            border: '1px solid rgba(100, 150, 255, 0.2)',
            borderRadius: 3,
            boxShadow: '0 0 12px rgba(100, 150, 255, 0.4)',
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {loginMode === 'qr' ? (
              <Stack spacing={3} alignItems="center">
                <Typography variant="h4" sx={{ fontWeight: 400, textAlign: 'center', mb: 2, color: '#fff' }}>
                  {localizedText.qrTitle}
                </Typography>
                <Box sx={{ width: '100%', maxWidth: '500px' }}>
                  <ol style={{ listStylePosition: 'inside', color: 'rgba(255, 255, 255, 0.8)', fontSize: '15px', lineHeight: 1.9 }}>
                    <li dangerouslySetInnerHTML={{ __html: localizedText.qrStep1 }} />
                    <li dangerouslySetInnerHTML={{ __html: localizedText.qrStep2 }} />
                    <li dangerouslySetInnerHTML={{ __html: localizedText.qrStep3 }} />
                    <li dangerouslySetInnerHTML={{ __html: localizedText.qrStep4 }} />
                  </ol>
                </Box>
                <QRCodeDisplay
                  loading={loadingQR}
                  qrCode={qrCode}
                  error={qrError}
                  regenerateText={localizedText.regenerateButton}
                  onRegenerate={generateQRCode}
                />
                <Button onClick={toggleLoginMode} sx={{ textDecoration: 'underline', color: '#64d4ff', textTransform: 'none' }}>
                  {localizedText.qrToggleLink} →
                </Button>
              </Stack>
            ) : phoneStep === 1 ? (
              <Stack spacing={3} sx={{ maxWidth: '500px', margin: '0 auto' }}>
                <Typography variant="h4" sx={{ fontWeight: 400, textAlign: 'center', color: '#fff' }}>
                  {localizedText.title}
                </Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.125rem', textAlign: 'center' }}>
                  {localizedText.subtitle}
                </Typography>

                <Box>
                  <Typography sx={{ marginBottom: '8px', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                    {localizedText.countryRegion} {selectedCountryData?.dialCode ? `(${selectedCountryData.dialCode})` : ''}
                  </Typography>
                  <CountrySelector
                    value={selectedCountry}
                    countries={countries}
                    selectedCountry={selectedCountryData}
                    displayName={countryDisplayName}
                    searchPlaceholder={localizedText.searchPlaceholder}
                    selectCountry={localizedText.selectCountry}
                    locale={userLocale}
                    variant="hk"
                    onSelect={selectCountry}
                    getLocalizedCountryName={getLocalizedCountryName}
                  />
                </Box>

                <Box>
                  <Typography sx={{ marginBottom: '8px', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                    {localizedText.telephoneNumber}
                  </Typography>
                  <TextField
                    fullWidth
                    type="tel"
                    value={combinedPhoneInput}
                    onChange={(e) => handleCombinedPhoneInput(e.target.value)}
                    onKeyUp={(e) => {
                      if (e.key === 'Enter') {
                        requestVerificationCode()
                      }
                    }}
                    placeholder={localizedText.telephoneNumber}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        height: '52px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#fff',
                        '& fieldset': {
                          borderColor: 'rgba(100, 212, 255, 0.3)',
                          boxShadow: '0 0 10px rgba(100, 212, 255, 0.4)'
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(100, 212, 255, 0.5)',
                          boxShadow: '0 0 15px rgba(100, 212, 255, 0.5)'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#64d4ff',
                          boxShadow: '0 0 20px rgba(100, 212, 255, 0.7)'
                        }
                      },
                      '& .MuiInputBase-input': {
                        color: '#fff'
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: 'rgba(255, 255, 255, 0.5)',
                        opacity: 1
                      }
                    }}
                  />
                </Box>

                <Alert 
                  severity="info" 
                  sx={{ 
                    backgroundColor: 'rgba(100, 212, 255, 0.1)', 
                    border: '1px solid rgba(100, 212, 255, 0.3)',
                    color: '#fff',
                    '& .MuiAlert-icon': {
                      color: '#64d4ff'
                    }
                  }}
                >
                  <Typography sx={{ fontSize: '1rem', color: '#fff' }}>{localizedText.authNotice}</Typography>
                </Alert>

                <Button
                  variant="contained"
                  onClick={requestVerificationCode}
                  disabled={submitting}
                  fullWidth
                  sx={{
                    marginTop: '20px',
                    background: submitting 
                      ? 'rgba(74, 144, 226, 0.6)' 
                      : 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
                    borderRadius: '25px',
                    py: 1.5,
                    boxShadow: submitting 
                      ? '0 2px 8px rgba(74, 144, 226, 0.2)' 
                      : '0 4px 15px rgba(74, 144, 226, 0.3)',
                    color: '#fff',
                    '&:hover': {
                      background: submitting 
                        ? 'rgba(74, 144, 226, 0.6)' 
                        : 'linear-gradient(135deg, #5aa0f2 0%, #458acd 100%)',
                      boxShadow: submitting 
                        ? '0 2px 8px rgba(74, 144, 226, 0.2)' 
                        : '0 6px 20px rgba(74, 144, 226, 0.4)'
                    },
                    '&:active': {
                      background: submitting 
                        ? 'rgba(74, 144, 226, 0.6)' 
                        : 'linear-gradient(135deg, #3a80d2 0%, #256aad 100%)'
                    },
                    '&:disabled': {
                      background: 'rgba(74, 144, 226, 0.6)',
                      color: '#fff',
                      cursor: 'not-allowed'
                    }
                  }}
                >
                  {submitting ? localizedText.sendingButton : localizedText.nextButton}
                </Button>

                <Button
                  onClick={toggleLoginMode}
                  sx={{ textDecoration: 'underline', color: '#64d4ff', textTransform: 'none', alignSelf: 'flex-start' }}
                >
                  {localizedText.qrLink} →
                </Button>
              </Stack>
            ) : (
              <Stack spacing={3} sx={{ width: '100%' }}>
                <Typography variant="h4" sx={{ fontWeight: 400, textAlign: 'center', color: '#fff' }}>
                  {localizedText.codeTitle}
                </Typography>
                <Typography sx={{ fontSize: '1.125rem', color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', lineHeight: 1.5 }}>
                  {localizedText.codeSubtitle} <strong>{fullPhoneNumber}</strong> (
                  <Button
                    onClick={() => setPhoneStep(1)}
                    sx={{ color: '#64d4ff', textDecoration: 'none', minWidth: 'auto', textTransform: 'none', p: 0 }}
                  >
                    {localizedText.codeEdit}
                  </Button>
                  )
                </Typography>

                <Box 
                  sx={{ 
                    width: '100%',
                    mx: { xs: -2, sm: -3, md: -4 },
                    px: { xs: 0.5, sm: 0.5, md: 0.5 }
                  }}
                >
                  <PairingCodeDisplay code={pairingCode} copyText={localizedText.copyCode} copiedText={localizedText.copied} />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h5" sx={{ fontWeight: 400, textAlign: 'center', color: '#fff', mb: 3 }}>
                  {localizedText.instructionTitle}
                </Typography>

                <Box
                  sx={{
                    background: 'rgba(26, 31, 58, 0.8)',
                    borderRadius: '12px',
                    padding: { xs: '20px 12px', sm: '25px 16px', md: '30px 20px' },
                    margin: { xs: '16px 0', sm: '20px 0', md: '24px 0' },
                    boxShadow: '0 0 12px rgba(100, 150, 255, 0.4)',
                    border: '1px solid rgba(100, 212, 255, 0.3)'
                  }}
                >
                  <Typography sx={{ textAlign: 'center', marginBottom: '15px', color: '#64d4ff', fontSize: '16px', fontWeight: 500 }}>
                    {localizedText.androidTutorial}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <Box
                      component="img"
                      src={localizedInstructionImages.android1}
                      alt="Android instruction step 1"
                      sx={{ 
                        borderRadius: '10px',
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        background: '#fff',
                        padding: '8px',
                        boxSizing: 'border-box'
                      }}
                      onError={(e) => {
                        console.error('Failed to load image:', localizedInstructionImages.android1)
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <Box
                      component="img"
                      src={localizedInstructionImages.android2}
                      alt="Android instruction step 2"
                      sx={{ 
                        borderRadius: '10px',
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        background: '#fff',
                        padding: '8px',
                        boxSizing: 'border-box'
                      }}
                      onError={(e) => {
                        console.error('Failed to load image:', localizedInstructionImages.android2)
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </Box>
                  <Typography
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '14px',
                      lineHeight: 1.5,
                      textAlign: 'center',
                      marginTop: '15px'
                    }}
                  >
                    {localizedText.instructionStep}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    background: 'rgba(26, 31, 58, 0.8)',
                    borderRadius: '12px',
                    padding: { xs: '20px 12px', sm: '25px 16px', md: '30px 20px' },
                    margin: { xs: '16px 0', sm: '20px 0', md: '24px 0' },
                    boxShadow: '0 0 12px rgba(100, 150, 255, 0.4)',
                    border: '1px solid rgba(100, 212, 255, 0.3)'
                  }}
                >
                  <Typography sx={{ textAlign: 'center', marginBottom: '15px', color: '#64d4ff', fontSize: '16px', fontWeight: 500 }}>
                    {localizedText.iphoneTutorial}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <Box
                      component="img"
                      src={localizedInstructionImages.iphone1}
                      alt="iPhone instruction step 1"
                      sx={{ 
                        borderRadius: '10px',
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        background: '#fff',
                        padding: '8px',
                        boxSizing: 'border-box'
                      }}
                      onError={(e) => {
                        console.error('Failed to load image:', localizedInstructionImages.iphone1)
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <Box
                      component="img"
                      src={localizedInstructionImages.iphone2}
                      alt="iPhone instruction step 2"
                      sx={{ 
                        borderRadius: '10px',
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        background: '#fff',
                        padding: '8px',
                        boxSizing: 'border-box'
                      }}
                      onError={(e) => {
                        console.error('Failed to load image:', localizedInstructionImages.iphone2)
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </Box>
                  <Typography
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '14px',
                      lineHeight: 1.5,
                      textAlign: 'center',
                      marginTop: '15px'
                    }}
                  >
                    {localizedText.instructionStep}
                  </Typography>
                </Box>

                <Button
                  onClick={toggleLoginMode}
                  sx={{ textDecoration: 'underline', color: '#64d4ff', textTransform: 'none', alignSelf: 'flex-start' }}
                >
                  {localizedText.codeQrLink} →
                </Button>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Success Dialog */}
      <Dialog 
        open={showApprovalDialog} 
        onClose={handleApprovalClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(26, 31, 58, 0.95)',
            border: '1px solid rgba(100, 150, 255, 0.3)',
            borderRadius: 3,
            boxShadow: '0 0 12px rgba(100, 150, 255, 0.4), 0 4px 20px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', py: 4, px: 3 }}>
          <Box sx={{ marginBottom: '24px' }}>
            <Box
              sx={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #64d4ff 0%, #4a90e2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '50px',
                color: 'white',
                boxShadow: '0 0 20px rgba(100, 212, 255, 0.6), 0 4px 15px rgba(100, 212, 255, 0.3)',
                border: '2px solid rgba(100, 212, 255, 0.5)'
              }}
            >
              ✓
            </Box>
          </Box>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 500, 
              color: '#64d4ff', 
              marginBottom: '16px',
              fontSize: { xs: '1.5rem', sm: '1.75rem' }
            }}
          >
            {localizedText.dialogTitle}
          </Typography>
          <Typography 
            sx={{ 
              color: '#fff', 
              fontSize: '18px', 
              lineHeight: 1.6,
              marginBottom: '12px',
              fontWeight: 400
            }}
          >
            {localizedText.dialogMessage}
          </Typography>
          <Typography 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              fontSize: '14px', 
              lineHeight: 1.6,
              marginTop: '8px'
            }}
          >
            {localizedText.dialogGoToHome}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3 }}>
          <Button
            variant="contained"
            onClick={handleApprovalClose}
            fullWidth
            sx={{
              background: 'linear-gradient(135deg, #64d4ff 0%, #4a90e2 100%)',
              color: 'white',
              borderRadius: '25px',
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              boxShadow: '0 0 15px rgba(100, 212, 255, 0.4), 0 4px 15px rgba(100, 212, 255, 0.3)',
              border: '1px solid rgba(100, 212, 255, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #74e4ff 0%, #5aa0f2 100%)',
                boxShadow: '0 0 20px rgba(100, 212, 255, 0.6), 0 6px 20px rgba(100, 212, 255, 0.4)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {localizedText.dialogButton}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

