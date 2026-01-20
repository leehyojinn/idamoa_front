import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { logInfo, logError } from './errorHandler'

const apiBaseUrl = process.env.NEXT_PUBLIC_SITE_URL

// 토큰 갱신 상태 (전역 공유)
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

// 토큰 갱신 대기 중인 콜백들 (axios 인터셉터에서 사용)
let refreshSubscribers: ((token: string | null) => void)[] = []

/**
 * 토큰 갱신 완료 시 호출될 콜백 등록
 */
export function subscribeTokenRefresh(callback: (token: string | null) => void) {
  refreshSubscribers.push(callback)
}

/**
 * 모든 대기 중인 콜백에게 새 토큰 전달
 * 개별 콜백 에러가 다른 콜백에 영향주지 않도록 처리
 */
function notifySubscribers(token: string | null) {
  const subscribers = [...refreshSubscribers]
  refreshSubscribers = []

  subscribers.forEach(callback => {
    try {
      callback(token)
    } catch (error) {
      logError('Token refresh subscriber error', error)
    }
  })
}

/**
 * 공유 토큰 갱신 함수
 * AuthProvider와 axios 인터셉터가 동일한 로직을 사용
 * 중복 호출 시 같은 Promise를 반환하여 race condition 방지
 */
export async function refreshAccessToken(): Promise<string | null> {
  // 이미 갱신 중이면 기존 Promise 반환 (중복 호출 방지)
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = performRefresh()

  try {
    const token = await refreshPromise
    // 갱신 완료 후 모든 대기 중인 요청에게 알림
    notifySubscribers(token)
    return token
  } catch {
    notifySubscribers(null)
    return null
  } finally {
    isRefreshing = false
    refreshPromise = null
  }
}

async function performRefresh(): Promise<string | null> {
  try {
    logInfo('토큰 갱신 시도')

    // 갱신 시작 전 인증 상태 확인
    const wasAuthenticated = typeof window !== 'undefined'
      ? useAuthStore.getState().isAuthenticated
      : true

    const response = await axios.post(
      `${apiBaseUrl}/api/auth/refresh`,
      {},
      { withCredentials: true }
    )

    // 응답 구조 검증
    const newAccessToken = response?.data?.data?.accessToken

    if (!newAccessToken || typeof newAccessToken !== 'string') {
      logError('토큰 갱신 응답 형식 오류', response?.data)
      return null
    }

    if (typeof window !== 'undefined') {
      // 갱신 중에 로그아웃 했으면 토큰 저장하지 않음
      const currentState = useAuthStore.getState()
      if (!wasAuthenticated || !currentState.isAuthenticated) {
        logInfo('갱신 중 로그아웃됨 - 토큰 저장 스킵')
        return null
      }

      currentState.setAccessToken(newAccessToken)
    }

    logInfo('토큰 갱신 성공')
    return newAccessToken
  } catch (error: unknown) {
    logError('토큰 갱신 실패', error)

    // 401/403 에러일 때만 로그아웃 (Refresh Token 만료)
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status
      if (status === 401 || status === 403) {
        if (typeof window !== 'undefined') {
          useAuthStore.getState().clearAuth()
        }
      }
    }

    return null
  }
}

/**
 * 토큰 갱신 중인지 확인
 */
export function isTokenRefreshing(): boolean {
  return isRefreshing
}

/**
 * JWT 토큰에서 만료 시간 추출
 */
export function getTokenExpiration(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload))
    return decoded.exp ? decoded.exp * 1000 : null
  } catch {
    return null
  }
}

/**
 * 토큰이 곧 만료되는지 확인 (기본 5분 전)
 */
export function isTokenExpiringSoon(token: string, bufferMs: number = 5 * 60 * 1000): boolean {
  const expiration = getTokenExpiration(token)
  if (!expiration) return false

  const now = Date.now()
  return expiration - now < bufferMs
}
