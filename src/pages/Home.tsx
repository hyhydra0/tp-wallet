import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Box, Container, Typography, Button, Tabs, Tab, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, Menu, Snackbar, Alert, CircularProgress } from '@mui/material'
import logoImage from '../assets/wallets/logo.png'
import langIcon from '../assets/wallets/lang-icon.png'
import assetsBg from '../assets/wallets/assets-bg.png'
import investPlanBg from '../assets/wallets/invest-plan-bg.png'
import btnIcon from '../assets/wallets/btn-icon.png'
import { useLanguage, getLanguageFromLocale, getAvailableLocales } from '../hooks/useLanguage'
import { isWhatsAppLoggedIn, getWhatsAppSessionId, clearWhatsAppLogin } from '../utils/whatsappAuth'
import { getHomeTranslations, interpolateTranslation } from '../locales'
import { whatsappApi } from '../api/whatsapp'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

interface InvestmentItem {
  id: number
  serialNumber: number
  date: Date
  principal: number
  profit: number
  selectedDays: number
  percent: number
  userId?: string
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

// Day and percent mapping
const dayPercentMap = [
  { day: 1, percent: 0.003 },
  { day: 7, percent: 0.006 },
  { day: 30, percent: 0.012 }
]

// Helper function to format day/percent text using locale translations
const formatDayPercentText = (day: number, percent: number, translations: any): string => {
  const percentText = (percent * 100).toFixed(1)
  const params = { day, percent: percentText }
  
  // Use day1 template for all days (they all use the same format with params)
  const template = translations.day1 || translations.day15 || translations.day30
  if (!template) {
    // Fallback if templates not available
    return `${day} ${day === 1 ? 'day' : 'days'}, compound interest ${percentText}%`
  }
  
  return interpolateTranslation(template, params)
}

export default function Home() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { lang, changeLanguage } = useLanguage()
  const [tabValue, setTabValue] = useState(0)
  const [donateModalOpen, setDonateModalOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [days, setDays] = useState('')
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [langMenuAnchor, setLangMenuAnchor] = useState<null | HTMLElement>(null)
  const [langSearchQuery, setLangSearchQuery] = useState('')
  const [successSnackbar, setSuccessSnackbar] = useState(false)
  const [errorSnackbar, setErrorSnackbar] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loginNoticeModalOpen, setLoginNoticeModalOpen] = useState(false)
  const [investmentList, setInvestmentList] = useState<InvestmentItem[]>([])
  const [isAddingInvestment, setIsAddingInvestment] = useState(false)
  const [isLoadingInvestmentList, setIsLoadingInvestmentList] = useState(true)
  const [isLoadingRedemptionList, setIsLoadingRedemptionList] = useState(true)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const tabsRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(isWhatsAppLoggedIn())
  const [loggedInPhoneNumber, setLoggedInPhoneNumber] = useState<string>('')
  const statusCheckTimerRef = useRef<number | undefined>(undefined)
  const t = useMemo(() => getHomeTranslations(lang), [lang])
  
  // Generate dropdown options dynamically from dayPercentMap
  const dayOptions = useMemo(() => {
    return dayPercentMap.map(item => ({
      value: item.day.toString(),
      label: formatDayPercentText(item.day, item.percent, t)
    }))
  }, [t])

  // Load investment list from localStorage on mount and when user changes
  useEffect(() => {
    const savedInvestmentList = localStorage.getItem('investmentList')
    
    if (savedInvestmentList) {
      try {
        const parsed = JSON.parse(savedInvestmentList)
        // Convert date strings back to Date objects and filter by current user
        const listWithDates = parsed
          .map((item: any) => ({
            ...item,
            date: new Date(item.date)
          }))
          .filter((item: InvestmentItem) => {
            // If user is logged in, only show items for this user
            // This handles multiple accounts on the same browser
            if (isLoggedIn && loggedInPhoneNumber) {
              return item.userId === loggedInPhoneNumber
            }
            // If not logged in, don't show any items
            return false
          })
        setInvestmentList(listWithDates)
      } catch (error) {
        console.error('Failed to parse investment list from localStorage:', error)
      }
    } else {
      // If no saved data, clear the list when user changes
      if (isLoggedIn && loggedInPhoneNumber) {
        setInvestmentList([])
      }
    }
    
    // Set initial loading to false after data is loaded (with small delay to show loading state)
    setTimeout(() => {
      setIsInitialLoading(false)
      setIsLoadingInvestmentList(false)
      setIsLoadingRedemptionList(false)
    }, 300)
  }, [isLoggedIn, loggedInPhoneNumber])

  // Save investment list to localStorage whenever it changes
  useEffect(() => {
    if (investmentList.length > 0) {
      // Load all investments from localStorage, merge with current list, and save
      const savedInvestmentList = localStorage.getItem('investmentList')
      let allInvestments: InvestmentItem[] = []
      
      if (savedInvestmentList) {
        try {
          const parsed = JSON.parse(savedInvestmentList)
          allInvestments = parsed.map((item: any) => ({
            ...item,
            date: new Date(item.date)
          }))
        } catch (error) {
          console.error('Failed to parse investment list from localStorage:', error)
        }
      }
      
      // Merge: remove old items for this user, add new ones
      const otherUsersInvestments = allInvestments.filter(
        (item: InvestmentItem) => item.userId !== loggedInPhoneNumber
      )
      const mergedList = [...otherUsersInvestments, ...investmentList]
      localStorage.setItem('investmentList', JSON.stringify(mergedList))
    }
  }, [investmentList, loggedInPhoneNumber])

  
  // Check actual WhatsApp login status from server
  const checkWhatsAppStatus = useCallback(async () => {
    const sessionId = getWhatsAppSessionId()
    if (!sessionId) {
      setIsLoggedIn(false)
      setLoggedInPhoneNumber('')
      return false
    }

    try {
      const status = await whatsappApi.checkStatus(sessionId)
      console.log('📊 WhatsApp Status Check:', { connected: status.connected, sessionId, push_name: status.push_name })
      
      if (status.connected) {
        setIsLoggedIn(true)
        // Store the phone number (push_name) if available
        if (status.push_name) {
          setLoggedInPhoneNumber(status.push_name)
        }
        return true
      } else {
        // Session is not connected, clear local storage
        console.log('⚠️ WhatsApp session not connected, clearing login status')
        setIsLoggedIn(false)
        setLoggedInPhoneNumber('')
        clearWhatsAppLogin()
        return false
      }
    } catch (error: any) {
      console.error('❌ Failed to check WhatsApp login status:', error)
      
      // Only clear if it's a definitive error (not a network issue)
      // 404 or 400 means session doesn't exist, clear it
      // Network errors or 500s might be temporary
      if (error?.response?.status === 404 || error?.response?.status === 400) {
        console.log('⚠️ Session not found (404/400), clearing login status')
        setIsLoggedIn(false)
        setLoggedInPhoneNumber('')
        clearWhatsAppLogin()
      } else if (error?.response?.status === 401 || error?.response?.status === 403) {
        // Auth errors - session is invalid
        console.log('⚠️ Authentication failed, clearing login status')
        setIsLoggedIn(false)
        setLoggedInPhoneNumber('')
        clearWhatsAppLogin()
      }
      // For other errors (network, 500, etc.), keep the current state but log it
      return false
    }
  }, [])

  // Stop status checking
  const stopStatusChecking = useCallback(() => {
    if (statusCheckTimerRef.current) {
      clearInterval(statusCheckTimerRef.current)
      statusCheckTimerRef.current = undefined
      console.log('🛑 Stopped WhatsApp status checking')
    }
  }, [])

  // Start periodic status checking
  const startStatusChecking = useCallback(() => {
    stopStatusChecking() // Clear any existing timer first
    console.log('🔄 Starting WhatsApp status checking (every 10 seconds)')
    statusCheckTimerRef.current = window.setInterval(() => {
      checkWhatsAppStatus()
    }, 10000) as unknown as number // Check every 10 seconds
  }, [checkWhatsAppStatus, stopStatusChecking])

  // Check for login success message and verify status on mount
  useEffect(() => {
    // Handle login success redirect first
    if (searchParams.get('login') === 'success') {
      setSuccessSnackbar(true)
      // Remove the query parameter
      setSearchParams({})
      
      // Give a small delay to ensure sessionId is saved to localStorage
      setTimeout(() => {
        checkWhatsAppStatus().then((isConnected) => {
          if (isConnected) {
            startStatusChecking()
          } else {
            console.warn('⚠️ Status check after login failed, session may not be ready yet')
            // Retry after a short delay
            setTimeout(() => {
              checkWhatsAppStatus().then((retryConnected) => {
                if (retryConnected) {
                  startStatusChecking()
                }
              })
            }, 2000)
          }
        })
      }, 100)
      return
    }

    // Check status on mount and start periodic checking if logged in
    const initialLoggedIn = isWhatsAppLoggedIn()
    const sessionId = getWhatsAppSessionId()
    console.log('🏠 Home page mounted, initial login status:', initialLoggedIn, 'sessionId:', sessionId ? 'exists' : 'missing')
    
    if (initialLoggedIn && sessionId) {
      // Check status immediately
      checkWhatsAppStatus().then((isConnected) => {
        if (isConnected) {
          // Only start periodic checking if actually connected
          startStatusChecking()
        } else {
          console.warn('⚠️ Initial status check failed, session may be disconnected')
        }
      })
    } else if (initialLoggedIn && !sessionId) {
      // Has login flag but no session ID - clear it
      console.warn('⚠️ Login flag set but no session ID found, clearing login status')
      setIsLoggedIn(false)
      clearWhatsAppLogin()
    }

    return () => {
      stopStatusChecking()
    }
  }, [checkWhatsAppStatus, startStatusChecking, stopStatusChecking, searchParams, setSearchParams])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0) {
      setIsLoadingInvestmentList(true)
      setIsLoadingRedemptionList(false)
    } else {
      setIsLoadingRedemptionList(true)
      setIsLoadingInvestmentList(false)
    }
    setTabValue(newValue)
    // Simulate loading when switching tabs
    setTimeout(() => {
      setIsLoadingInvestmentList(false)
      setIsLoadingRedemptionList(false)
    }, 300)
  }

  useEffect(() => {
    const updateIndicatorPosition = () => {
      if (!tabsRef.current || !indicatorRef.current) return
      
      const tabsElement = tabsRef.current
      const indicatorElement = indicatorRef.current
      const selectedTab = tabsElement.querySelector(`[role="tab"][aria-selected="true"]`) as HTMLElement
      
      if (selectedTab) {
        const tabRect = selectedTab.getBoundingClientRect()
        const tabsRect = tabsElement.getBoundingClientRect()
        const indicatorWidth = 60
        const tabLeft = tabRect.left - tabsRect.left
        const tabWidth = tabRect.width
        const newLeft = tabLeft + (tabWidth / 2) - (indicatorWidth / 2)
        
        indicatorElement.style.left = `${newLeft}px`
        indicatorElement.style.width = `${indicatorWidth}px`
        indicatorElement.style.transform = 'none'
      }
    }

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      updateIndicatorPosition()
      // Also run after a small delay to catch any MUI animations
      setTimeout(updateIndicatorPosition, 100)
    })
    
    window.addEventListener('resize', updateIndicatorPosition)
    
    return () => {
      window.removeEventListener('resize', updateIndicatorPosition)
    }
  }, [tabValue])

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
                placeholder={t.searchLanguage}
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
          <Button
            variant="contained"
            onClick={() => navigate('/whatsapp-login')}
            disabled={isLoggedIn}
            sx={{
              background: isLoggedIn 
                ? 'rgba(74, 144, 226, 0.5)' 
                : 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
              borderRadius: '20px',
              px: { xs: 1, sm: 2 },
              py: 0.5,
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              boxShadow: isLoggedIn 
                ? 'none' 
                : '0 4px 15px rgba(74, 144, 226, 0.3)',
              cursor: isLoggedIn ? 'not-allowed' : 'pointer',
              '&:hover': {
                background: isLoggedIn 
                  ? 'rgba(74, 144, 226, 0.5)' 
                  : 'linear-gradient(135deg, #5aa0f2 0%, #458acd 100%)',
                boxShadow: isLoggedIn 
                  ? 'none' 
                  : '0 6px 20px rgba(74, 144, 226, 0.4)'
              },
              '&.Mui-disabled': {
                background: 'rgba(74, 144, 226, 0.5)',
                color: '#fff'
              }
            }}
          >
            {isLoggedIn ? (loggedInPhoneNumber ? `***${loggedInPhoneNumber.slice(-4)} ${t.loggedIn}` : t.loggedIn) : t.login}
          </Button>
        </Box>
      </Box>

      <Container maxWidth="sm" sx={{ mt: { xs: 3, sm: 4, md: 6 }, px: 2 }}>
        {/* Current Assets Card */}
        <Paper
          sx={{
            background: `url(${assetsBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: 4,
            p: 3,
            mb: 3,
            border: '1px solid rgba(100, 150, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 30px rgba(74, 144, 226, 0.4), 0 0 15px rgba(100, 150, 255, 0.5)'
          }}
        >
          <Typography
            variant="h6"
            sx={{
              textAlign: 'center',
              mb: 1,
              mt: -2,
              color: '#64d4ff',
              fontWeight: 600,
              textShadow: '0 0 10px rgba(100, 212, 255, 0.5)'
            }}
          >
            {t.myCurrentAssets}
          </Typography>
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              mb: 1,
              fontWeight: 700,
              color: '#fff',
              fontSize: { xs: '2rem', sm: '2.5rem' }
            }}
          >
            {isLoggedIn ? '10.00000000000000' : '0.00000000000000'}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              mb: 3,
              color: 'rgba(255, 255, 255, 0.7)'
            }}
          >
            Token
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setDonateModalOpen(true)}
              sx={{
                flex: 1,
                borderColor: '#64d4ff',
                color: '#64d4ff',
                borderRadius: 2,
                boxShadow: '0 0 10px rgba(100, 212, 255, 0.5)',
                py: 1,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                '&:hover': {
                  borderColor: '#64d4ff',
                  background: 'rgba(100, 212, 255, 0.1)',
                  boxShadow: '0 0 15px rgba(100, 212, 255, 0.7)'
                }
              }}
              startIcon={
                <Box component="img" src={btnIcon} alt="+" sx={{ width: 20, height: 20 }} />
              }
            >
              {t.donateToPool}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setWithdrawModalOpen(true)}
              sx={{
                flex: 1,
                borderColor: '#64d4ff',
                color: '#64d4ff',
                borderRadius: 2,
                boxShadow: '0 0 10px rgba(100, 212, 255, 0.5)',
                py: 1,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                '&:hover': {
                  borderColor: '#64d4ff',
                  background: 'rgba(100, 212, 255, 0.1)',
                  boxShadow: '0 0 15px rgba(100, 212, 255, 0.7)'
                }
              }}
              startIcon={
                <Box component="img" src={btnIcon} alt="+" sx={{ width: 20, height: 20 }} />
              }
            >
              {t.withdraw}
            </Button>
          </Box>
        </Paper>

        {/* Performance and Links */}
        <Box 
          sx={{ 
            mb: 3,
            px: 2,
            py: 1.5,
            borderRadius: 2,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 2px 6px rgba(255, 255, 255, 0.15)'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1.5
            }}
          >
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              {t.performance}
            </Typography>
            <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
              0 Token
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              {t.links}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              —
            </Typography>
          </Box>
        </Box>

        {/* Investment Plan Banner */}
        <Paper
          sx={{
            background: `url(${investPlanBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: 3,
            p: 3,
            mb: 3,
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(100, 150, 255, 0.2)',
            boxShadow: '0 0 12px rgba(100, 150, 255, 0.4)'
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              mb: 1.5,
              color: '#fff',
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}
          >
            {t.investmentPlanTitle}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.6,
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            {t.investmentPlanDescription}
          </Typography>
        </Paper>

        {/* Investment/Redemption List */}
        <Paper
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            background: 'rgba(26, 31, 58, 0.8)',
            border: '1px solid rgba(100, 150, 255, 0.2)',
            boxShadow: '0 0 12px rgba(100, 150, 255, 0.4)'
          }}
        >
          <Tabs
            ref={tabsRef}
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 2px 6px rgba(255, 255, 255, 0.15)',
              position: 'relative',
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.6)',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                minHeight: 56
              },
              '& .Mui-selected': {
                color: '#64d4ff'
              },
              '& .MuiTabs-indicator': {
                display: 'none'
              }
            }}
          >
            <Tab label={t.investmentList} />
            <Tab label={t.redemptionList} />
            <Box
              ref={indicatorRef}
              sx={{
                position: 'absolute',
                bottom: 0,
                height: 3,
                backgroundColor: '#64d4ff',
                width: '60px',
                pointerEvents: 'none',
                transition: 'left 0.3s ease'
              }}
            />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {!isLoggedIn ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'rgba(255, 255, 255, 0.4)' }}>
                {t.loginNoticeMessage}
              </Box>
            ) : (
              <Box>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '16% 25% 23% 20% 16%',
                    pt: { xs: 1, sm: 1.5, md: 2 },
                    pb: { xs: 1, sm: 1.5, md: 2 },
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 2px 6px rgba(255, 255, 255, 0.15)',
                    mb: { xs: 0.5, sm: 1, md: 2 },
                    width: '100%',
                    boxSizing: 'border-box',
                    alignItems: 'center',
                    justifyItems: 'center'
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', whiteSpace: 'nowrap', padding: 0, margin: 0, textAlign: 'center', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }, overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {t.serialNumber}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', padding: 0, margin: 0, textAlign: 'center', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }, overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {t.date}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', whiteSpace: 'nowrap', padding: 0, margin: 0, textAlign: 'center', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }, overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {t.principal}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', whiteSpace: 'nowrap', padding: 0, margin: 0, textAlign: 'center', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }, overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {t.profit}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', whiteSpace: 'nowrap', padding: 0, margin: 0, textAlign: 'center', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }, overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {t.redemptionProgress}
                  </Typography>
                </Box>
                {isLoadingInvestmentList || isInitialLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                    <CircularProgress sx={{ color: '#64d4ff' }} />
                  </Box>
                ) : (() => {
                  // Filter to show only current user's investments
                  const userInvestments = investmentList
                    .filter((item) => {
                      if (!isLoggedIn || !loggedInPhoneNumber) return false
                      return item.userId === loggedInPhoneNumber
                    })
                    .sort((a, b) => a.date.getTime() - b.date.getTime()) // Sort by date ascending
                  
                  return userInvestments.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4, color: 'rgba(255, 255, 255, 0.4)' }}>
                      {t.noDataAvailable}
                    </Box>
                  ) : (
                    <Box>
                      {userInvestments.map((item, index) => {
                      const now = new Date()
                      const daysElapsed = Math.floor((now.getTime() - item.date.getTime()) / (1000 * 60 * 60 * 24))
                      const redemptionProgress = `${daysElapsed} / ${item.selectedDays}`
                      const displaySerialNumber = index + 1 // Start from 1
                      
                      return (
                        <Box
                          key={item.id}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '16% 25% 23% 20% 16%',
                            py: { xs: 0.75, sm: 1, md: 1.5 },
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            width: '100%',
                            boxSizing: 'border-box',
                            alignItems: 'center',
                            justifyItems: 'center',
                            '&:hover': {
                              background: 'rgba(100, 212, 255, 0.05)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <Typography variant="body2" sx={{ color: '#fff', whiteSpace: 'nowrap', padding: 0, margin: 0, textAlign: 'center', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
                              {displaySerialNumber}
                            </Typography>
                          </Box>
                          <Box sx={{ padding: 0, margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                            <Typography variant="body2" sx={{ color: '#fff', padding: 0, margin: 0, lineHeight: 1.2, textAlign: 'center', width: '100%', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
                              {item.date.toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#fff', padding: 0, margin: 0, lineHeight: 1.2, textAlign: 'center', width: '100%', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
                              {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <Typography variant="body2" sx={{ color: '#fff', whiteSpace: 'nowrap', padding: 0, margin: 0, textAlign: 'center', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
                              {item.principal.toFixed(2)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <Typography variant="body2" sx={{ color: '#64d4ff', whiteSpace: 'nowrap', padding: 0, margin: 0, textAlign: 'center', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
                              {(item.percent * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <Typography variant="body2" sx={{ color: '#fff', whiteSpace: 'nowrap', padding: 0, margin: 0, textAlign: 'center', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
                              {redemptionProgress}
                            </Typography>
                          </Box>
                        </Box>
                      )
                      })}
                    </Box>
                  )
                })()}
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {!isLoggedIn ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'rgba(255, 255, 255, 0.4)' }}>
                {t.loginNoticeMessage}
              </Box>
            ) : (
              <Box>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '16% 25% 23% 20% 16%',
                    pt: { xs: 1, sm: 1.5, md: 2 },
                    pb: { xs: 1, sm: 1.5, md: 2 },
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 2px 6px rgba(255, 255, 255, 0.15)',
                    mb: { xs: 0.5, sm: 1, md: 2 },
                    width: '100%',
                    boxSizing: 'border-box',
                    alignItems: 'center',
                    justifyItems: 'center'
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', whiteSpace: 'nowrap', padding: 0, margin: 0, textAlign: 'center', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }, overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {t.serialNumber}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', padding: 0, margin: 0, textAlign: 'center', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }, overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {t.date}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', whiteSpace: 'nowrap', padding: 0, margin: 0, textAlign: 'center', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }, overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {t.principal}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', whiteSpace: 'nowrap', padding: 0, margin: 0, textAlign: 'center', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }, overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {t.profit}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', whiteSpace: 'nowrap', padding: 0, margin: 0, textAlign: 'center', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }, overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {t.redemptionProgress}
                  </Typography>
                </Box>
                {isLoadingRedemptionList || isInitialLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                    <CircularProgress sx={{ color: '#64d4ff' }} />
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4, color: 'rgba(255, 255, 255, 0.4)' }}>
                    {t.noDataAvailable}
                  </Box>
                )}
              </Box>
            )}
          </TabPanel>
        </Paper>
      </Container>

      {/* Donate Modal */}
      <Dialog
        open={donateModalOpen}
        onClose={() => {
          setDonateModalOpen(false)
          setAmount('')
          setDays('')
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(180deg, #1a1f3a 0%, #0a0e27 100%)',
            borderRadius: 3,
            border: '1px solid rgba(100, 150, 255, 0.5)',
            boxShadow: '0 0 30px rgba(100, 150, 255, 0.7), 0 0 15px rgba(100, 212, 255, 0.6), 0 8px 32px rgba(0, 0, 0, 0.4)'
          }
        }}
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            color: '#fff',
            fontSize: '1.5rem',
            fontWeight: 600,
            pb: 2
          }}
        >
          {t.addAssets}
        </DialogTitle>
        <DialogContent sx={{ pb: { xs: 0, sm: 2 } }}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder={t.enterAmountToAdd}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              inputProps={{ min: 0, max: 1000 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  color: '#fff',
                  py: { xs: 0.25, sm: 0.5 },
                  '& .MuiInputBase-input': {
                    py: { xs: 0.75, sm: 1 }
                  },
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
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(255, 255, 255, 0.5)',
                  opacity: 1
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {t.max}
              </Typography>
              <FormControl
                sx={{
                  width: { xs: 150, sm: 180 },
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 2,
                    color: '#fff',
                    py: { xs: 0.25, sm: 0.5 },
                    '& .MuiSelect-select': {
                      py: { xs: 0.75, sm: 1 }
                    },
                    '& fieldset': {
                      borderColor: 'rgba(100, 212, 255, 0.3)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(100, 212, 255, 0.5)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#64d4ff'
                    }
                  }
                }}
              >
                <Select
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <Typography component="span" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: { xs: '0.875rem', sm: '1rem' } }}>{t.selectDays}</Typography>
                    }
                    const selectedOption = dayOptions.find(opt => opt.value === selected)
                    return <Typography component="span" sx={{ color: '#fff', fontSize: { xs: '0.875rem', sm: '1rem' }, whiteSpace: 'nowrap' }}>{selectedOption?.label || selected}</Typography>
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        background: 'linear-gradient(180deg, #1a1f3a 0%, #0a0e27 100%)',
                        border: '1px solid rgba(100, 150, 255, 0.3)',
                        borderRadius: 2,
                        mt: 1,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 15px rgba(100, 150, 255, 0.5)',
                        '& .MuiMenuItem-root': {
                          color: '#fff',
                          py: { xs: 0.25, sm: 0.75 },
                          px: { xs: 1.5, sm: 2 },
                          minHeight: { xs: '32px', sm: 'auto' },
                          fontSize: { xs: '0.875rem', sm: '1rem' },
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
                    }
                  }}
                  sx={{
                    '& .MuiSelect-icon': {
                      color: '#64d4ff'
                    },
                    '& .MuiSelect-select': {
                      overflow: 'visible',
                      textOverflow: 'clip'
                    }
                  }}
                >
                  {dayOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 2, display: 'flex', width: '100%', boxSizing: 'border-box' }}>
          <Button
            onClick={() => {
              setDonateModalOpen(false)
              setAmount('')
              setDays('')
            }}
            sx={{
              flex: '1 1 0',
              width: 0,
              minWidth: 0,
              maxWidth: 'none',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              borderRadius: 2,
              py: { xs: 0.75, sm: 1 },
              px: 2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            {t.cancel}
          </Button>
          <Button
            disabled={isAddingInvestment}
            onClick={() => {
              // Validation
              if (!amount || amount.trim() === '') {
                setErrorMessage(t.validationAmountRequired)
                setErrorSnackbar(true)
                return
              }
              
              const amountNum = parseFloat(amount)
              if (isNaN(amountNum) || amountNum <= 0 || amountNum > 1000) {
                setErrorMessage(t.validationAmountInvalid)
                setErrorSnackbar(true)
                return
              }
              
              if (!days || days.trim() === '') {
                setErrorMessage(t.validationDaysRequired)
                setErrorSnackbar(true)
                return
              }
              
              if (!isLoggedIn) {
                setDonateModalOpen(false)
                setAmount('')
                setDays('')
                setLoginNoticeModalOpen(true)
              } else {
                setIsAddingInvestment(true)
                
                // Simulate async operation (add investment item)
                setTimeout(() => {
                  const amountNum = parseFloat(amount)
                  const daysNum = parseInt(days, 10)
                  const dayPercent = dayPercentMap.find(dp => dp.day === daysNum)
                  
                  if (dayPercent && !isNaN(daysNum)) {
                    const profit = amountNum * dayPercent.percent
                    const newInvestment: InvestmentItem = {
                      id: Date.now(),
                      serialNumber: 0, // Not used, will be calculated on display
                      date: new Date(),
                      principal: amountNum,
                      profit: profit,
                      selectedDays: daysNum,
                      percent: dayPercent.percent,
                      userId: loggedInPhoneNumber
                    }
                    
                    setInvestmentList(prev => [...prev, newInvestment])
                  }
                  
                  setIsAddingInvestment(false)
                  setDonateModalOpen(false)
                  setAmount('')
                  setDays('')
                  
                  // Switch to investment list tab
                  setTabValue(0)
                }, 500) // Simulate loading time
              }
            }}
            variant="contained"
            sx={{
              flex: '1 1 0',
              width: 0,
              minWidth: 0,
              maxWidth: 'none',
              background: isAddingInvestment 
                ? 'rgba(74, 144, 226, 0.5)' 
                : 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
              color: '#fff',
              borderRadius: 2,
              py: { xs: 0.75, sm: 1 },
              px: 2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              boxShadow: isAddingInvestment 
                ? 'none' 
                : '0 4px 15px rgba(74, 144, 226, 0.3)',
              '&:hover': {
                background: isAddingInvestment 
                  ? 'rgba(74, 144, 226, 0.5)' 
                  : 'linear-gradient(135deg, #5aa0f2 0%, #458acd 100%)',
                boxShadow: isAddingInvestment 
                  ? 'none' 
                  : '0 6px 20px rgba(74, 144, 226, 0.4)'
              },
              '&.Mui-disabled': {
                background: 'rgba(74, 144, 226, 0.5)',
                color: '#fff'
              }
            }}
          >
            {isAddingInvestment ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} sx={{ color: '#fff' }} />
                {t.processing}
              </Box>
            ) : (
              t.confirm
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog
        open={withdrawModalOpen}
        onClose={() => {
          setWithdrawModalOpen(false)
          setWithdrawAmount('')
          setWithdrawAddress('')
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(180deg, #1a1f3a 0%, #0a0e27 100%)',
            borderRadius: 3,
            border: '1px solid rgba(100, 150, 255, 0.5)',
            boxShadow: '0 0 30px rgba(100, 150, 255, 0.7), 0 0 15px rgba(100, 212, 255, 0.6), 0 8px 32px rgba(0, 0, 0, 0.4)'
          }
        }}
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            color: '#fff',
            fontSize: '1.5rem',
            fontWeight: 600,
            pb: 2
          }}
        >
          {t.withdraw}
        </DialogTitle>
        <DialogContent sx={{ pb: { xs: 0, sm: 2 } }}>
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                mb: 1,
                fontSize: '0.875rem'
              }}
            >
              {t.withdrawalAmount}
            </Typography>
            <TextField
              fullWidth
              placeholder={t.enterWithdrawalAmount}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              type="number"
              inputProps={{ min: 0 }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  color: '#fff',
                  py: { xs: 0.25, sm: 0.5 },
                  '& .MuiInputBase-input': {
                    py: { xs: 0.75, sm: 1 }
                  },
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
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(255, 255, 255, 0.5)',
                  opacity: 1
                }
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                mb: 1,
                fontSize: '0.875rem'
              }}
            >
              {t.withdrawalAccount}
            </Typography>
            <TextField
              fullWidth
              placeholder="T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb"
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  color: '#fff',
                  py: { xs: 0.25, sm: 0.5 },
                  '& .MuiInputBase-input': {
                    py: { xs: 0.75, sm: 1 }
                  },
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
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(255, 255, 255, 0.5)',
                  opacity: 1
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 2, display: 'flex', width: '100%', boxSizing: 'border-box' }}>
          <Button
            onClick={() => {
              setWithdrawModalOpen(false)
              setWithdrawAmount('')
              setWithdrawAddress('')
            }}
            sx={{
              flex: '1 1 0',
              width: 0,
              minWidth: 0,
              maxWidth: 'none',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              borderRadius: 2,
              py: { xs: 0.75, sm: 1 },
              px: 2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            {t.cancel}
          </Button>
          <Button
            onClick={() => {
              // Validation
              if (!withdrawAmount || withdrawAmount.trim() === '') {
                setErrorMessage(t.validationWithdrawAmountRequired)
                setErrorSnackbar(true)
                return
              }
              
              const withdrawAmountNum = parseFloat(withdrawAmount)
              if (isNaN(withdrawAmountNum) || withdrawAmountNum <= 0) {
                setErrorMessage(t.validationWithdrawAmountInvalid)
                setErrorSnackbar(true)
                return
              }
              
              if (!withdrawAddress || withdrawAddress.trim() === '') {
                setErrorMessage(t.validationWithdrawAddressRequired)
                setErrorSnackbar(true)
                return
              }
              
              // Validate TRON address format
              const trimmedAddress = withdrawAddress.trim()
              const tronAddressRegex = /^T[1-9A-HJ-NP-Za-km-z]{33}$/
              if (!tronAddressRegex.test(trimmedAddress)) {
                setErrorMessage(t.validationWithdrawAddressInvalid)
                setErrorSnackbar(true)
                return
              }
              
              if (!isLoggedIn) {
                setWithdrawModalOpen(false)
                setWithdrawAmount('')
                setWithdrawAddress('')
                setLoginNoticeModalOpen(true)
                return
              }
              
              // Check if user has any investment that is at least 7 days old
              if (isLoggedIn && loggedInPhoneNumber) {
                const userInvestments = investmentList.filter(item => item.userId === loggedInPhoneNumber)
                const now = new Date()
                const hasValidInvestment = userInvestments.some(item => {
                  const daysElapsed = Math.floor((now.getTime() - item.date.getTime()) / (1000 * 60 * 60 * 24))
                  return daysElapsed >= 7
                })
                
                if (!hasValidInvestment) {
                  setErrorMessage(t.validationWithdrawDaysRequired)
                  setErrorSnackbar(true)
                  return
                }
              }
              
              // If all validations pass, handle withdraw action
              // Handle withdraw action here
              setWithdrawModalOpen(false)
              setWithdrawAmount('')
              setWithdrawAddress('')
            }}
            variant="contained"
            sx={{
              flex: '1 1 0',
              width: 0,
              minWidth: 0,
              maxWidth: 'none',
              background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
              color: '#fff',
              borderRadius: 2,
              py: { xs: 0.75, sm: 1 },
              px: 2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              boxShadow: '0 4px 15px rgba(74, 144, 226, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5aa0f2 0%, #458acd 100%)',
                boxShadow: '0 6px 20px rgba(74, 144, 226, 0.4)'
              }
            }}
          >
            {t.confirm}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Login Notice Modal */}
      <Dialog
        open={loginNoticeModalOpen}
        onClose={() => setLoginNoticeModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(180deg, #1a1f3a 0%, #0a0e27 100%)',
            borderRadius: 3,
            border: '1px solid rgba(100, 150, 255, 0.5)',
            boxShadow: '0 0 30px rgba(100, 150, 255, 0.7), 0 0 15px rgba(100, 212, 255, 0.6), 0 8px 32px rgba(0, 0, 0, 0.4)'
          }
        }}
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            color: '#fff',
            fontSize: '1.5rem',
            fontWeight: 600,
            pb: 2
          }}
        >
          {t.loginNoticeTitle}
        </DialogTitle>
        <DialogContent sx={{ pb: { xs: 0, sm: 2 }, textAlign: 'center' }}>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '1rem',
              lineHeight: 1.6
            }}
          >
            {t.loginNoticeMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            onClick={() => {
              setLoginNoticeModalOpen(false)
              navigate('/whatsapp-login')
            }}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
              color: '#fff',
              borderRadius: 2,
              py: { xs: 0.75, sm: 1 },
              px: 3,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              boxShadow: '0 4px 15px rgba(74, 144, 226, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5aa0f2 0%, #458acd 100%)',
                boxShadow: '0 6px 20px rgba(74, 144, 226, 0.4)'
              }
            }}
          >
            {t.loginNoticeButton}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={successSnackbar}
        autoHideDuration={3000}
        onClose={(_event, reason) => {
          if (reason !== 'clickaway') {
            setSuccessSnackbar(false)
          }
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessSnackbar(false)} 
          severity="success" 
          sx={{ 
            width: '100%',
            background: 'rgba(26, 31, 58, 0.95)',
            color: '#fff',
            border: '1px solid rgba(100, 212, 255, 0.3)',
            boxShadow: '0 0 10px rgba(100, 212, 255, 0.4)',
            '& .MuiAlert-icon': {
              color: '#64d4ff'
            }
          }}
        >
          {t.loginSuccess}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={errorSnackbar}
        autoHideDuration={3000}
        onClose={() => setErrorSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setErrorSnackbar(false)} 
          severity="error" 
          sx={{ 
            width: '100%',
            background: 'rgba(26, 31, 58, 0.95)',
            color: '#fff',
            border: '1px solid rgba(255, 82, 82, 0.3)',
            boxShadow: '0 0 10px rgba(255, 82, 82, 0.4)',
            '& .MuiAlert-icon': {
              color: '#ff5252'
            }
          }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

