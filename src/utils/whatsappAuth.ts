/**
 * Utility functions for managing WhatsApp login status
 */

const WHATSAPP_LOGIN_KEY = 'whatsapp_login_status'
const WHATSAPP_SESSION_KEY = 'whatsapp_session_id'

/**
 * Check if user has completed WhatsApp login
 */
export const isWhatsAppLoggedIn = (): boolean => {
  try {
    const status = localStorage.getItem(WHATSAPP_LOGIN_KEY)
    return status === 'true'
  } catch {
    return false
  }
}

/**
 * Set WhatsApp login status to completed
 */
export const setWhatsAppLoggedIn = (sessionId?: string): void => {
  try {
    localStorage.setItem(WHATSAPP_LOGIN_KEY, 'true')
    if (sessionId) {
      localStorage.setItem(WHATSAPP_SESSION_KEY, sessionId)
    }
  } catch (error) {
    console.error('Failed to save WhatsApp login status:', error)
  }
}

/**
 * Clear WhatsApp login status
 */
export const clearWhatsAppLogin = (): void => {
  try {
    localStorage.removeItem(WHATSAPP_LOGIN_KEY)
    localStorage.removeItem(WHATSAPP_SESSION_KEY)
  } catch (error) {
    console.error('Failed to clear WhatsApp login status:', error)
  }
}

/**
 * Get WhatsApp session ID
 */
export const getWhatsAppSessionId = (): string | null => {
  try {
    return localStorage.getItem(WHATSAPP_SESSION_KEY)
  } catch {
    return null
  }
}

