import axios, { AxiosError } from 'axios'
import { message } from 'antd'
import { getToken, removeToken } from '../utils/auth'

// Create axios instance
export const apiClient = axios.create({
  baseURL: '/api/v1', // 通过 Vite 代理转发到 localhost:5800
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string }>) => {
    // Handle error responses
    const status = error.response?.status
    let errorMsg: string

    if (status === 401) {
      // Token expired or invalid — redirect to login
      removeToken()
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    if (status === 409) {
      errorMsg = '资源已存在，无法创建重复资源 / Resource already exists'
    } else if (status === 404) {
      errorMsg = '资源未找到 / Resource not found'
    } else if (status === 400) {
      errorMsg = '请求参数错误 / Bad request'
    } else if (status === 500) {
      errorMsg = '服务器内部错误 / Internal server error'
    } else if (status === 503) {
      errorMsg = '服务暂时不可用 / Service unavailable'
    } else {
      errorMsg = error.response?.data?.error || error.message || '请求失败 / Request failed'
    }
    
    // 仅在非静默模式下弹出错误（Dashboard 的计数查询会静默失败）
    const isSilent = (error.config as any)?._silent
    if (!isSilent) {
      message.error(errorMsg)
    }
    return Promise.reject(error)
  }
)

// 不走 /api/v1 前缀的系统接口，直接用 axios
export const systemClient = axios.create({
  baseURL: '/',
  timeout: 10000,
})

export const systemApi = {
  health: async (): Promise<{ success: boolean; data?: string }> => {
    const { data } = await systemClient.get('health')
    return data
  },
  ready: async (): Promise<{ success: boolean; data?: string }> => {
    const { data } = await systemClient.get('ready')
    return data
  },
  serverInfo: async (): Promise<{ success: boolean; data?: { server_id: string; ready: boolean } }> => {
    const { data } = await apiClient.get('server-info')
    return data
  },
  reload: async (): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post('reload')
    return data
  },
}

