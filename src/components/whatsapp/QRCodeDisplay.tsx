import { Box, Button, CircularProgress, Typography } from '@mui/material'

interface QRCodeDisplayProps {
  loading: boolean
  qrCode: string
  error: string
  regenerateText: string
  onRegenerate: () => void
}

export default function QRCodeDisplay({ loading, qrCode, error, regenerateText, onRegenerate }: QRCodeDisplayProps) {
  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={40} sx={{ color: '#64d4ff' }} />
          <Box sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>Generating QR Code...</Box>
        </Box>
      )}

      {qrCode && !error && !loading && (
        <Box
          sx={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            padding: '24px',
            maxWidth: '264px'
          }}
        >
          <Box component="img" src={qrCode} alt="QR Code" sx={{ width: '100%', maxWidth: '264px', height: 'auto', display: 'block' }} />
        </Box>
      )}

      {error && (
        <Box sx={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>{error}</Typography>
          <Button
            variant="contained"
            onClick={onRegenerate}
            sx={{
              background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
              color: 'white',
              borderRadius: '8px',
              px: 3,
              py: 1,
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              boxShadow: '0 4px 15px rgba(74, 144, 226, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5aa0f2 0%, #458acd 100%)',
                boxShadow: '0 6px 20px rgba(74, 144, 226, 0.4)'
              }
            }}
          >
            {regenerateText}
          </Button>
        </Box>
      )}
    </Box>
  )
}

