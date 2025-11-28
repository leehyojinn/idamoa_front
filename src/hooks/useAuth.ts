import { useAuthStore } from '@/stores/authStore'
import { login as loginApi, logout as logoutApi } from '@/lib/api/auth'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { showErrorToast, showSuccessToast, logError } from '@/lib/errorHandler'

export const useAuth = () => {
  const router = useRouter()

  // QueryClient을 안전하게 가져오기 (SSR 시에는 null 반환)
  let queryClient: ReturnType<typeof useQueryClient> | null = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    queryClient = useQueryClient()
  } catch {
    // SSR 환경에서는 QueryClient가 없을 수 있음
    queryClient = null
  }

  const { user, isAuthenticated, _hasHydrated, setUser, setAccessToken, clearAuth } = useAuthStore()

  const login = async (email: string, password: string) => {
    try {
      const response = await loginApi({ email, password })

      if (response.success) {
        // ✅ Access Token을 메모리에만 저장 (Refresh Token은 httpOnly 쿠키로 자동 저장)
        if (response.data.accessToken) {
          setAccessToken(response.data.accessToken)
        }

        // 사용자 정보 저장
        setUser({
          email,
          profileCompleted: response.data.profileCompleted,
          currentRole: response.data.currentRole,
        })

        showSuccessToast('로그인 성공!')

        // 프로필 완성 여부에 따라 리다이렉트
        if (!response.data.profileCompleted) {
          router.push('/signup/profile-type')
        } else {
          router.push('/')
        }

        return response
      }
    } catch (error: unknown) {
      logError('로그인 실패', error)
      showErrorToast(error, '로그인에 실패했습니다')
      throw error
    }
  }

  const logout = async () => {
    try {
      await logoutApi()

      // ✅ 인증 상태 초기화 (메모리의 accessToken도 자동 제거됨, Refresh Token은 백엔드에서 쿠키 삭제)
      clearAuth()

      // ✅ React Query 캐시 모두 초기화 (로그아웃 후 이전 사용자 데이터 제거)
      if (queryClient) {
        queryClient.clear()
      }

      showSuccessToast('로그아웃되었습니다')
      router.push('/login')
    } catch (error: unknown) {
      logError('로그아웃 실패', error)
      // 에러가 나도 로컬 데이터는 삭제
      clearAuth()
      // React Query 캐시도 초기화
      if (queryClient) {
        queryClient.clear()
      }
      router.push('/login')
    }
  }

  return {
    user: _hasHydrated ? user : null, // localStorage 로딩 완료 전에는 null 리턴
    isAuthenticated: _hasHydrated ? isAuthenticated : false,
    login,
    logout,
  }
}
