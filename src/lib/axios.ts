import axios from 'axios'
import toast from 'react-hot-toast'
import { logError, logInfo } from './errorHandler'
import { useAuthStore } from '@/stores/authStore'
import { refreshAccessToken, isTokenRefreshing, subscribeTokenRefresh } from './tokenRefresh'

/**
 * Axios 인스턴스 설정
 * 기본 URL과 공통 설정을 미리 정의
 */

const apiBaseUrl = process.env.NEXT_PUBLIC_SITE_URL;

// 리다이렉트 중복 방지 플래그
let isRedirecting = false;

// 로그인이 필요한 페이지 경로 (이 페이지에서만 토큰 만료 시 로그인 페이지로 리다이렉트)
const AUTH_REQUIRED_PATHS = [
  '/mypage',
  '/admin',
  '/consultations/new',
  '/planner/create',
  '/planner/my',
  '/inquiries/my',
  '/payment',
  '/proposals',
]

// 현재 페이지가 로그인이 필요한 페이지인지 확인
const isAuthRequiredPage = (path: string): boolean => {
  // 경로가 AUTH_REQUIRED_PATHS로 시작하면 로그인 필요
  if (AUTH_REQUIRED_PATHS.some(authPath => path.startsWith(authPath))) {
    return true
  }
  // /create 또는 /edit으로 끝나는 경로는 로그인 필요
  if (path.endsWith('/create') || path.endsWith('/edit')) {
    return true
  }
  return false
}

const axiosInstance = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  timeout: 30000, // 30초 (파일 업로드 등 고려)
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
      const token = useAuthStore.getState().accessToken
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

    // 상담 조회 비밀번호 검증 실패는 토큰 갱신 로직 건너뛰기
    const isConsultationVerify = originalRequest.url?.includes('/consultations/') && originalRequest.url?.includes('/verify')

    // 403 에러 (권한 없음) - 관리자 페이지 접근 시
    if (error.response?.status === 403) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''

      // 관리자 페이지에서 403 에러가 나면 홈으로 리다이렉트
      if (currentPath.startsWith('/admin')) {
        if (typeof window !== 'undefined' && !isRedirecting) {
          isRedirecting = true

          toast.error('관리자 권한이 필요합니다.', {
            duration: 3000,
          })

          setTimeout(() => {
            window.location.href = '/'
            setTimeout(() => {
              isRedirecting = false
            }, 1000)
          }, 1000)
        }

        return Promise.reject(error)
      }
    }

    // 401 에러 && 아직 재시도 안했으면 토큰 갱신 (단, 상담 조회는 제외)
    if (error.response?.status === 401 && !originalRequest._retry && !isConsultationVerify) {
      originalRequest._retry = true

      // 이미 토큰 갱신 중이면 대기 후 재시도
      // tokenRefresh.ts의 subscriber를 통해 완료 알림을 받음
      if (isTokenRefreshing()) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token: string | null) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`
              resolve(axiosInstance(originalRequest))
            } else {
              reject(error)
            }
          })
        })
      }

      try {
        // 공유 토큰 갱신 함수 사용
        // refreshAccessToken 내부에서 subscriber들에게 알림을 보냄
        const newAccessToken = await refreshAccessToken()

        if (newAccessToken) {
          logInfo('토큰 갱신 성공', '원래 요청 재시도')

          // 실패했던 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return axiosInstance(originalRequest)
        } else {
          // 갱신 실패
          throw new Error('Token refresh failed')
        }
      } catch (refreshError) {
        // Refresh Token도 만료됨 → 리다이렉트 처리
        logError('토큰 갱신 실패', refreshError)

        if (typeof window !== 'undefined') {
          // 이미 리다이렉트 중이거나 로그인 페이지에 있으면 스킵
          const currentPath = window.location.pathname
          const currentSearch = window.location.search
          if (!isRedirecting && !currentPath.startsWith('/login') && !currentPath.startsWith('/signup')) {
            // 로그인이 필요한 페이지에서만 로그인 페이지로 리다이렉트
            if (isAuthRequiredPage(currentPath)) {
              isRedirecting = true

              toast.error('세션이 만료되었습니다. 다시 로그인해주세요.', {
                duration: 3000,
              })

              // 잠시 후 로그인 페이지로 이동
              setTimeout(() => {
                // 로그인 후 원래 페이지로 돌아가도록 redirect 파라미터 추가
                const redirectUrl = encodeURIComponent(currentPath + currentSearch)
                window.location.href = `/login?redirect=${redirectUrl}`
                // 리다이렉트 완료 후 플래그 리셋
                setTimeout(() => {
                  isRedirecting = false
                }, 1000)
              }, 1000)
            } else {
              // 로그인이 필요없는 페이지에서는 토스트 메시지만 표시
              toast.error('세션이 만료되었습니다.', {
                duration: 3000,
              })
            }
          }
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
