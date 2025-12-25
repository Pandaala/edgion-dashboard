import axios, { AxiosError } from 'axios'
import { message } from 'antd'

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
    // TODO: Add authentication token if needed
    // const token = getToken()
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
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
    
    message.error(errorMsg)
    return Promise.reject(error)
  }
)

// Health check API
export const healthApi = {
  check: async (): Promise<{ success: boolean; data?: string }> => {
    const { data } = await axios.get('/health')
    return data
  },
}

