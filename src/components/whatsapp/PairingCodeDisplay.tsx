import { useState } from 'react'
import { Button, Box } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

interface PairingCodeDisplayProps {
  code: string
  copyText?: string
  copiedText?: string
}

export default function PairingCodeDisplay({ code, copyText = 'Copy Code', copiedText = 'Copied!' }: PairingCodeDisplayProps) {
  const [isCopied, setIsCopied] = useState(false)

  // Ensure code is a string and split it
  const codeArray = code && typeof code === 'string' ? code.split('') : []

  const copyCode = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      // Silent fail
    }
  }

  // Don't render if code is empty
  if (!code || codeArray.length === 0) {
    return null
  }

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box
        sx={{
          display: 'flex',
          gap: { xs: '3px', sm: '6px', md: '8px' },
          justifyContent: 'center',
          margin: '10px 0',
          flexWrap: 'nowrap',
          padding: { xs: '15px 6px', sm: '20px 8px', md: '25px 10px' },
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          border: '1px solid rgba(100, 212, 255, 0.3)',
          boxShadow: '0 0 10px rgba(100, 212, 255, 0.4)',
          overflowX: 'auto',
          overflowY: 'hidden',
          '&::-webkit-scrollbar': {
            height: '4px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(100, 212, 255, 0.3)',
            borderRadius: '2px'
          }
        }}
      >
        {codeArray.map((char, index) => (
          <Box
            key={index}
            sx={{
              width: { xs: '32px', sm: '40px', md: '44px' },
              height: { xs: '40px', sm: '48px', md: '50px' },
              minWidth: { xs: '32px', sm: '40px', md: '44px' },
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: { xs: '18px', sm: '22px', md: '26px' },
              fontWeight: 600,
              color: '#fff',
              background: 'rgba(26, 31, 58, 0.8)',
              border: index === 4 ? 'none' : '1px solid rgba(100, 212, 255, 0.3)',
              borderRadius: '8px',
              fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
              letterSpacing: 0,
              boxShadow: index !== 4 ? '0 0 6px rgba(100, 212, 255, 0.3)' : 'none',
              ...(index === 4 && {
                background: 'transparent',
                fontWeight: 400,
                color: '#64d4ff',
                width: { xs: '14px', sm: '18px', md: '20px' },
                minWidth: { xs: '14px', sm: '18px', md: '20px' },
                fontSize: { xs: '16px', sm: '20px', md: '24px' }
              })
            }}
          >
            {char}
          </Box>
        ))}
      </Box>
      <Button
        variant="contained"
        onClick={copyCode}
        startIcon={<ContentCopyIcon />}
        sx={{
          marginTop: '20px',
          padding: { xs: '10px 20px', sm: '12px 24px' },
          background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
          color: 'white',
          borderRadius: '8px',
          fontSize: { xs: '14px', sm: '15px' },
          fontWeight: 500,
          boxShadow: '0 4px 15px rgba(74, 144, 226, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5aa0f2 0%, #458acd 100%)',
            boxShadow: '0 6px 20px rgba(74, 144, 226, 0.4)'
          },
          '&:active': {
            background: 'linear-gradient(135deg, #3a80d2 0%, #256aad 100%)'
          }
        }}
      >
        {isCopied ? copiedText : copyText}
      </Button>
    </Box>
  )
}

