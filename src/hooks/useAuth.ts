import { useAuthStore } from '@/store/authStore'
import { login as loginApi, logout as logoutApi } from '@/lib/api/auth'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export const useAuth = () => {
  const router = useRouter()
  const { user, isAuthenticated, setUser, clearAuth } = useAuthStore()

  const login = async (email: string, password: string) => {
    try {
      const response = await loginApi({ email, password })

      if (response.success) {
        // 토큰 저장
        localStorage.setItem('accessToken', response.data.accessToken)
        localStorage.setItem('refreshToken', response.data.refreshToken)

        // 사용자 정보 저장
        setUser({
          email,
          profileCompleted: response.data.profileCompleted,
          currentRole: response.data.currentRole,
        })

        toast.success('로그인 성공!')

        // 프로필 완성 여부에 따라 리다이렉트
        if (!response.data.profileCompleted) {
          router.push('/signup/profile-type')
        } else {
          router.push('/')
        }

        return response
      }
    } catch (error: any) {
      console.error('로그인 실패:', error)
      toast.error(error.response?.data?.message || '로그인에 실패했습니다')
      throw error
    }
  }

  const logout = async () => {
    try {
      await logoutApi()

      // 로컬 스토리지 및 상태 클리어
      localStorage.clear()
      clearAuth()

      toast.success('로그아웃되었습니다')
      router.push('/login')
    } catch (error: any) {
      console.error('로그아웃 실패:', error)
      // 에러가 나도 로컬 데이터는 삭제
      localStorage.clear()
      clearAuth()
      router.push('/login')
    }
  }

  return {
    user,
    isAuthenticated,
    login,
    logout,
  }
}
