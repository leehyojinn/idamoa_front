'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { refreshAccessToken, isTokenExpiringSoon, isTokenRefreshing } from '@/lib/tokenRefresh'

/**
 * AuthProvider
 * - 토큰이 만료되기 전에 선제적으로 갱신
 * - 창이 다시 포커스될 때 토큰 상태 확인
 * - 주기적인 토큰 확인 (10분마다)
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const lastCheckRef = useRef(0)

  // 토큰 상태 확인 및 필요시 갱신 (디바운스 적용)
  const checkAndRefreshToken = async () => {
    // 이미 갱신 중이면 스킵
    if (isTokenRefreshing()) return

    // 3초 이내 중복 호출 방지 (탭 전환 시 visibility + focus 동시 발생 대응)
    const now = Date.now()
    if (now - lastCheckRef.current < 3000) return
    lastCheckRef.current = now

    const { isAuthenticated, accessToken } = useAuthStore.getState()
    if (!isAuthenticated || !accessToken) return

    if (isTokenExpiringSoon(accessToken)) {
      await refreshAccessToken()
    }
  }

  // 초기 로드 및 주기적 체크
  useEffect(() => {
    const { _hasHydrated } = useAuthStore.getState()
    if (!_hasHydrated) {
      // hydration 완료 대기
      const unsubscribe = useAuthStore.subscribe((state) => {
        if (state._hasHydrated) {
          checkAndRefreshToken()
          unsubscribe()
        }
      })
      return unsubscribe
    }

    // 초기 토큰 체크
    checkAndRefreshToken()

    // 10분마다 토큰 체크
    const intervalId = setInterval(checkAndRefreshToken, 10 * 60 * 1000)

    return () => clearInterval(intervalId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 창 포커스 시 토큰 체크 (탭 전환 후 돌아왔을 때)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndRefreshToken()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
