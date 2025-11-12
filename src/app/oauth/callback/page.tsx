'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

// ========================================
// Component
// ========================================

export default function OAuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setUser = useAuthStore((state) => state.setUser)

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // URL 파라미터에서 데이터 추출
        const success = searchParams.get('success')
        const accessToken = searchParams.get('accessToken')
        const refreshToken = searchParams.get('refreshToken')
        const requiresProfileSetup =
          searchParams.get('requiresProfileSetup') === 'true'
        const email = searchParams.get('email')

        if (success === 'true' && accessToken) {
          // 토큰 저장
          localStorage.setItem('accessToken', accessToken)
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken)
          }

          // 사용자 정보 저장
          setUser({
            email: email || '',
            profileCompleted: !requiresProfileSetup,
            currentRole: 'USER',
          })

          toast.success('로그인 성공!')

          // 프로필 설정이 필요하면 프로필 설정 페이지로, 아니면 메인 페이지로
          if (requiresProfileSetup) {
            router.push('/signup/profile-type')
          } else {
            router.push('/')
          }
        } else {
          throw new Error('로그인에 실패했습니다.')
        }
      } catch (error) {
        console.error('OAuth 콜백 처리 실패:', error)
        toast.error('로그인에 실패했습니다.')
        router.push('/login')
      }
    }

    handleOAuthCallback()
  }, [searchParams, router, setUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-lg font-semibold text-gray-700">로그인 처리 중...</p>
        <p className="text-sm text-gray-500 mt-2">
          잠시만 기다려주세요
        </p>
      </div>
    </div>
  )
}
