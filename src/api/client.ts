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
    const errorMsg = error.response?.data?.error || error.message || '请求失败'
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

