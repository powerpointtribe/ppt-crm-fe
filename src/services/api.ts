import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import type { ApiError } from '../types'
import { useAppStore } from '@/store'

class ApiService {
  private client: AxiosInstance

  constructor(baseURL: string = import.meta.env.VITE_API_BASE_URL || '/api/v1') {
    this.client = axios.create({
      baseURL,
      timeout: 30000, // Increased timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: false, // Explicitly set for CORS
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        // Start loading indicator
        useAppStore.getState().startApiLoading()

        const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
          console.log(`API Request: ${config.method?.toUpperCase()} ${config.url} with token: ${token.substring(0, 20)}...`)
        } else {
          console.log(`API Request: ${config.method?.toUpperCase()} ${config.url} without token`)
        }
        return config
      },
      (error) => {
        // Stop loading on request error
        useAppStore.getState().stopApiLoading()
        return Promise.reject(error)
      }
    )

    this.client.interceptors.response.use(
      (response) => {
        // Stop loading on successful response
        useAppStore.getState().stopApiLoading()
        return response
      },
      (error) => {
        // Stop loading on error response
        useAppStore.getState().stopApiLoading()
        console.error('API Error Details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            baseURL: error.config?.baseURL,
          }
        })

        const apiError: ApiError = {
          message: error.response?.data?.message || error.message || 'An error occurred',
          code: error.response?.data?.code || error.response?.status,
          details: error.response?.data?.error || error.response?.data?.details,
        }

        // Enhanced network error handling
        if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
          // Only use generic message if there's no backend error message
          if (!error.response?.data?.message && !error.response?.data?.error) {
            apiError.message = 'Unable to connect to server. Please check your internet connection or try again later.'
          }
          apiError.code = 'NETWORK_ERROR'

          // Log additional debug information
          console.warn('Network Error Details:', {
            baseURL: error.config?.baseURL,
            url: error.config?.url,
            method: error.config?.method,
            timeout: error.config?.timeout
          })
        }

        if (error.response?.status === 401) {
          const currentPath = window.location.pathname
          const isLoginRequest = error.config?.url?.includes('/auth/login')
          const isAuthRequest = error.config?.url?.includes('/auth/')

          // Don't clear tokens or auto-redirect - let AuthContext handle this
          // Only handle auto-redirect for login page after some time has passed
          if (!isAuthRequest && !isLoginRequest) {
            const lastLoginAttempt = parseInt(localStorage.getItem('lastLoginAttempt') || '0')
            const timeSinceLogin = Date.now() - lastLoginAttempt

            // Only auto-redirect if we're not on login page and enough time has passed
            if (currentPath !== '/login' && timeSinceLogin > 10000) {
              setTimeout(() => {
                if (window.location.pathname !== '/login' && !localStorage.getItem('auth_token')) {
                  window.location.href = '/login'
                }
              }, 3000)
            }
          }
        }

        return Promise.reject(apiError)
      }
    )
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config)
    return response.data
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config)
    return response.data
  }
}

export const apiService = new ApiService()
