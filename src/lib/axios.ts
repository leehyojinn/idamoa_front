import axios from 'axios'
import toast from 'react-hot-toast'
import { logError, logInfo } from './errorHandler'
import { useAuthStore } from '@/store/authStore'

/**
 * Axios 인스턴스 설정
 * 기본 URL과 공통 설정을 미리 정의
 */

const apiBaseUrl = process.env.NEXT_PUBLIC_SITE_URL;

const axiosInstance = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ⭐ 쿠키 자동 전송/수신 활성화
})

/**
 * 요청 인터셉터
 * 모든 요청 전에 실행됩니다
 */
axiosInstance.interceptors.request.use(
  (config) => {
    // 토큰이 있으면 헤더에 추가 (클라이언트에서만)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    logInfo('API 요청', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    logError('요청 에러', error)
    return Promise.reject(error)
  }
)

/**
 * 응답 인터셉터
 * 모든 응답 후에 실행됩니다
 */
axiosInstance.interceptors.response.use(
  (response) => {
    logInfo('API 응답', response.status, response.config.url)
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // 401 에러 && 아직 재시도 안했으면 토큰 갱신
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        logInfo('토큰 갱신 시도')

        // Refresh Token으로 새 Access Token 발급
        // refreshToken은 httpOnly 쿠키로 자동 전송됨
        const response = await axios.post(
          `${apiBaseUrl}/api/auth/refresh`,
          {}, // ⭐ 빈 객체 (쿠키가 자동으로 전송됨)
          { withCredentials: true } // ⭐ 쿠키 전송 활성화
        )

        const newAccessToken = response.data.data.accessToken

        // ✅ 새 Access Token만 저장 (Refresh Token은 쿠키에 자동 저장)
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', newAccessToken)
        }

        logInfo('토큰 갱신 성공', '원래 요청 재시도')

        // 실패했던 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        // Refresh Token도 만료됨 → 로그아웃 처리
        logError('토큰 갱신 실패', refreshError)

        // ✅ Access Token 삭제 및 인증 상태 초기화
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          useAuthStore.getState().clearAuth()
        }

        // 사용자에게 알림
        if (typeof window !== 'undefined') {
          toast.error('세션이 만료되었습니다. 다시 로그인해주세요.', {
            duration: 3000,
          })

          // 잠시 후 로그인 페이지로 이동
          setTimeout(() => {
            window.location.href = '/login'
          }, 1000)
        }

        return Promise.reject(refreshError)
      }
    }

    // 에러 로깅 (개발 환경에서만)
    logError('API 에러', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
    })

    return Promise.reject(error)
  }
)

export default axiosInstance
