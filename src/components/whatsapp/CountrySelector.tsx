import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Box, TextField, List, ListItem, ListItemButton, Typography, Portal } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import CheckIcon from '@mui/icons-material/Check'
import type { Country } from '../../data/countries'

interface CountrySelectorProps {
  value: string
  countries: Country[]
  selectedCountry: Country | null
  displayName: string
  searchPlaceholder: string
  selectCountry: string
  locale: string
  variant?: 'wa' | 'hk'
  onSelect: (country: Country) => void
  getLocalizedCountryName: (code: string, locale: string) => string
}

export default function CountrySelector({
  value,
  countries,
  selectedCountry,
  displayName,
  searchPlaceholder,
  selectCountry,
  locale,
  variant = 'wa',
  onSelect,
  getLocalizedCountryName
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const selectorRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null)

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return countries

    const query = searchQuery.toLowerCase().trim()

    return countries.filter(country => {
      // Quick checks first (most common cases)
      if (country.dialCode.includes(query) || country.code.toLowerCase().includes(query)) {
        return true
      }
      if (country.name.toLowerCase().includes(query) || country.nameZh.toLowerCase().includes(query)) {
        return true
      }
      // Only call expensive localized name function if needed
      try {
        const localizedName = getLocalizedCountryName(country.code, locale).toLowerCase()
        return localizedName.includes(query)
      } catch {
        return false
      }
    })
  }, [searchQuery, countries, locale, getLocalizedCountryName])

  // Cache for country display names to avoid repeated expensive calls
  const displayNameCache = useRef(new Map<string, string>())
  
  // Memoize display name calculation per country to avoid repeated expensive calls
  const getCountryDisplayName = useCallback((country: Country): string => {
    const cacheKey = `${country.code}-${locale}`
    if (displayNameCache.current.has(cacheKey)) {
      return displayNameCache.current.get(cacheKey)!
    }

    const language = locale.split('-')[0].toLowerCase()
    let result: string

    try {
      const localizedName = getLocalizedCountryName(country.code, locale)

      if (localizedName && localizedName !== country.code) {
        result = localizedName
      } else if (language === 'zh') {
        result = country.nameZh
      } else {
        result = country.name
      }
    } catch {
      result = language === 'zh' ? country.nameZh : country.name
    }

    displayNameCache.current.set(cacheKey, result)
    return result
  }, [locale, getLocalizedCountryName])

  const shouldShowSecondaryName = useCallback((country: Country): boolean => {
    const language = locale.split('-')[0].toLowerCase()
    const primaryName = getCountryDisplayName(country)

    if (primaryName !== country.name && language !== 'en') {
      return true
    }

    if (language === 'en' && country.nameZh !== country.name) {
      return true
    }

    return false
  }, [locale, getCountryDisplayName])

  const getSecondaryCountryName = useCallback((country: Country): string => {
    const language = locale.split('-')[0].toLowerCase()
    const primaryName = getCountryDisplayName(country)

    if (primaryName !== country.name) {
      return country.name
    }

    if (language === 'en') {
      return country.nameZh
    }

    return country.name
  }, [locale, getCountryDisplayName])

  const handleCountrySelect = (country: Country) => {
    onSelect(country)
    setIsOpen(false)
    setSearchQuery('')
  }

  useEffect(() => {
    let rafId: number | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const updatePosition = () => {
      if (selectorRef.current) {
        const rect = selectorRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width
        })
      }
    }

    const throttledUpdatePosition = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      rafId = requestAnimationFrame(() => {
        updatePosition()
        rafId = null
      })
    }

    const debouncedUpdatePosition = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        updatePosition()
        timeoutId = null
      }, 100)
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false)
          setSearchQuery('')
        }
      }
    }

    if (isOpen && selectorRef.current) {
      // Calculate initial dropdown position
      updatePosition()
      
      // Update position on scroll/resize with throttling
      window.addEventListener('scroll', throttledUpdatePosition, { passive: true })
      window.addEventListener('resize', debouncedUpdatePosition, { passive: true })
      document.addEventListener('click', handleClickOutside)
      
      setTimeout(() => searchInputRef.current?.focus(), 100)
    } else {
      setDropdownPosition(null)
    }

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }
      window.removeEventListener('scroll', throttledUpdatePosition)
      window.removeEventListener('resize', debouncedUpdatePosition)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  return (
    <Box ref={selectorRef} sx={{ position: 'relative', width: '100%', zIndex: 1300 }}>
      <Box
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          width: '100%',
          padding: '16px',
          border: '1px solid rgba(100, 212, 255, 0.3)',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          transition: 'all 0.2s',
          outline: 'none',
          boxSizing: 'border-box',
          height: '52px',
          minHeight: '52px',
          boxShadow: '0 0 10px rgba(100, 212, 255, 0.4)',
          '&:hover': {
            borderColor: 'rgba(100, 212, 255, 0.5)',
            boxShadow: '0 0 15px rgba(100, 212, 255, 0.5)'
          },
          '&:focus': {
            borderColor: '#64d4ff',
            boxShadow: '0 0 20px rgba(100, 212, 255, 0.7)'
          }
        }}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
      >
        {selectedCountry && (
          <Box
            component="img"
            src={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`}
            srcSet={`https://flagcdn.com/w80/${selectedCountry.code.toLowerCase()}.png 2x`}
            alt={`${selectedCountry.name} flag`}
            sx={{
              width: '24px',
              height: '18px',
              objectFit: 'cover',
              borderRadius: '2px',
              flexShrink: 0,
              display: 'block',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          />
        )}
        <Typography
          sx={{
            flex: 1,
            fontSize: '15px',
            color: '#fff',
            textAlign: 'left'
          }}
        >
          {selectedCountry ? displayName : selectCountry}
        </Typography>
        <KeyboardArrowDownIcon
          sx={{
            color: '#64d4ff',
            transition: 'transform 0.2s',
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        />
      </Box>

      {isOpen && dropdownPosition && (
        <Portal>
          <Box
            ref={dropdownRef}
            sx={{
              position: 'fixed',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              background: 'linear-gradient(180deg, #1a1f3a 0%, #0a0e27 100%)',
              border: '1px solid rgba(100, 150, 255, 0.3)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 15px rgba(100, 150, 255, 0.5)',
              zIndex: 1300,
              maxHeight: '360px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
          <Box sx={{ position: 'relative', padding: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', flexShrink: 0 }}>
            <SearchIcon
              sx={{
                position: 'absolute',
                left: '24px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64d4ff',
                pointerEvents: 'none'
              }}
            />
            <TextField
              inputRef={searchInputRef}
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              sx={{
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  paddingLeft: '40px',
                  fontSize: '14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  '& fieldset': {
                    borderColor: 'rgba(100, 212, 255, 0.3)',
                    borderRadius: '6px',
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
          <List
            sx={{
              overflowY: 'auto',
              flex: 1,
              '&::-webkit-scrollbar': {
                width: '6px'
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent'
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(100, 212, 255, 0.3)',
                borderRadius: '3px',
                '&:hover': {
                  background: 'rgba(100, 212, 255, 0.5)'
                }
              }
            }}
          >
            {filteredCountries.map((country) => (
              <ListItem key={country.code} disablePadding>
                <ListItemButton
                  onClick={() => handleCountrySelect(country)}
                  sx={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                    backgroundColor: country.code === value ? 'rgba(100, 212, 255, 0.2)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(100, 212, 255, 0.1)'
                    }
                  }}
                >
                  <Box
                    component="img"
                    src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                    srcSet={`https://flagcdn.com/w80/${country.code.toLowerCase()}.png 2x`}
                    alt={`${country.name} flag`}
                    sx={{
                      width: '24px',
                      height: '18px',
                      objectFit: 'cover',
                      borderRadius: '2px',
                      flexShrink: 0,
                      display: 'block',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: country.code === value ? '#64d4ff' : '#fff',
                        fontWeight: 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {getCountryDisplayName(country)}
                    </Typography>
                    {shouldShowSecondaryName(country) && (
                      <Typography
                        sx={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.6)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {getSecondaryCountryName(country)}
                      </Typography>
                    )}
                  </Box>
                  <Typography sx={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', marginLeft: '8px', flexShrink: 0 }}>
                    {country.dialCode}
                  </Typography>
                  {country.code === value && (
                    <CheckIcon sx={{ marginLeft: '8px', flexShrink: 0, color: '#64d4ff', fontSize: '16px' }} />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          </Box>
        </Portal>
      )}
    </Box>
  )
}

