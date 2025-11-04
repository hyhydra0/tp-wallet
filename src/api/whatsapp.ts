import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// WhatsApp API响应类型
export interface QRCodeResponse {
  session_id: string
  qr_code: string
  timeout: number
  created_at: string
}

export interface LoginStatusResponse {
  connected: boolean
  jid?: string
  push_name?: string
  platform?: string
  last_seen: string
}

export interface PairingCodeResponse {
  session_id: string
  pairing_code: string
  timeout: number
}

export interface VerifyCodeResponse {
  success: boolean
  connected: boolean
  jid?: string
}

// WhatsApp API
export const whatsappApi = {
  // 生成登录二维码
  async generateQR(): Promise<QRCodeResponse> {
    const response = await api.post<any>('/whatsapp/qr', {})
    console.log('Raw API response:', response)
    console.log('Response data:', response.data)
    
    // Handle API response format: may be wrapped in { code, data, message } or direct response
    const data = response.data
    
    // If response.data exists and has nested structure
    if (data && typeof data === 'object') {
      // Check for wrapped response: { code: 0, data: { qr_code, session_id, ... } }
      if ('code' in data && data.code === 0 && data.data) {
        console.log('Found wrapped response with code:', data.data)
        return data.data as QRCodeResponse
      }
      
      // Check for wrapped response: { data: { qr_code, session_id, ... } }
      if (data.data && typeof data.data === 'object' && 'qr_code' in data.data) {
        console.log('Found nested data response:', data.data)
        return data.data as QRCodeResponse
      }
      
      // Check if it's already the QRCodeResponse format
      if ('qr_code' in data && 'session_id' in data) {
        console.log('Found direct QRCodeResponse:', data)
        return data as QRCodeResponse
      }
      
      // Check for success wrapper: { success: true, data: { ... } }
      if (data.success === true && data.data) {
        console.log('Found success wrapper:', data.data)
        return data.data as QRCodeResponse
      }
    }
    
    console.error('Unable to parse response:', data)
    throw new Error('Invalid response format: ' + JSON.stringify(data))
  },

  // 获取配对码（手机号登录）
  async getPairingCode(phoneNumber: string): Promise<PairingCodeResponse> {
    const response = await api.post<any>('/pairing-code', { phone_number: phoneNumber })
    // Handle API response format: may be wrapped in { code, data, message } or direct response
    const data = response.data
    if (data && typeof data === 'object') {
      // If response has 'data' field (wrapped response), use it
      if (data.data && typeof data.data === 'object') {
        return data.data as PairingCodeResponse
      }
      // If response has 'code' field (API format), check if successful
      if ('code' in data) {
        if (data.code === 0 && data.data) {
          return data.data as PairingCodeResponse
        }
        throw new Error(data.message || 'Failed to get pairing code')
      }
      // Direct response
      return data as PairingCodeResponse
    }
    throw new Error('Invalid response format')
  },

  // 验证配对码
  async verifyPairingCode(sessionId: string, code: string): Promise<VerifyCodeResponse> {
    const response = await api.post<VerifyCodeResponse>('/verify-code', { session_id: sessionId, code })
    return response.data
  },

  // 检查登录状态
  async checkStatus(sessionID: string): Promise<LoginStatusResponse> {
    try {
      const response = await api.get<any>('/whatsapp/status', { params: { session_id: sessionID } })
      console.log('📡 Status check API response:', response)
      
      // Handle API response format: may be wrapped in { code, data, message } or direct response
      const data = response.data
      console.log('📡 Status check response data:', data)
      
      if (data && typeof data === 'object') {
        // If response has 'data' field (wrapped response), use it
        if (data.data && typeof data.data === 'object' && ('connected' in data.data || 'jid' in data.data)) {
          console.log('✅ Found wrapped response with data:', data.data)
          return data.data as LoginStatusResponse
        }
        // If response has 'code' field (API format), check if successful
        if ('code' in data) {
          if (data.code === 0 && data.data) {
            console.log('✅ Found code:0 response with data:', data.data)
            return data.data as LoginStatusResponse
          }
          // If code is not 0, it might be an error, but check if data exists
          if (data.data && typeof data.data === 'object') {
            console.log('⚠️ Code is not 0 but data exists:', data.data)
            return data.data as LoginStatusResponse
          }
          throw new Error(data.message || 'Failed to check status')
        }
        // Check if it's already the LoginStatusResponse format
        if ('connected' in data || 'jid' in data) {
          console.log('✅ Found direct LoginStatusResponse:', data)
          return data as LoginStatusResponse
        }
        // Check for success wrapper
        if (data.success === true && data.data) {
          console.log('✅ Found success wrapper:', data.data)
          return data.data as LoginStatusResponse
        }
      }
      
      console.error('❌ Unable to parse status response:', data)
      throw new Error('Invalid response format: ' + JSON.stringify(data))
    } catch (error: any) {
      console.error('❌ Status check API error:', error)
      console.error('❌ Error response:', error?.response?.data)
      console.error('❌ Error status:', error?.response?.status)
      throw error
    }
  },

  // 断开连接
  async disconnect(sessionID: string): Promise<void> {
    await api.post('/whatsapp/disconnect', { session_id: sessionID })
  },

  // 恢复会话
  async restore(sessionID: string): Promise<void> {
    await api.post('/whatsapp/restore', { session_id: sessionID })
  },

  // 清理过期会话
  async cleanup(): Promise<void> {
    await api.post('/whatsapp/cleanup')
  }
}

export default whatsappApi

