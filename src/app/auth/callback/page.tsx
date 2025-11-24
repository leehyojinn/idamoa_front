'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { refreshTokenWithCookie } from '@/lib/api/auth'
import { showErrorToast, showSuccessToast, logError } from '@/lib/errorHandler'

// ========================================
// Component
// ========================================

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setUser = useAuthStore((state) => state.setUser)
  const setAccessToken = useAuthStore((state) => state.setAccessToken)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URL 파라미터에서 데이터 추출
        const success = searchParams.get('success')
        const requiresProfileSetup = searchParams.get('requiresProfileSetup') === 'true'
        const error = searchParams.get('error')

        // 에러가 있으면 에러 처리
        if (error) {
          throw new Error(decodeURIComponent(error))
        }

        if (success !== 'true') {
          throw new Error('로그인에 실패했습니다.')
        }

        // Refresh Token(httpOnly 쿠키)으로 Access Token 발급
        const response = await refreshTokenWithCookie()

        if (response.success && response.data) {
          const tokenInfo = response.data

          // Access Token 저장
          setAccessToken(tokenInfo.accessToken)

          // 사용자 정보 저장
          setUser({
            email: '',
            profileCompleted: tokenInfo.profileCompleted,
            currentRole: tokenInfo.currentRole,
          })

          setStatus('success')
          showSuccessToast('로그인 성공!')

          // 프로필 설정이 필요하면 프로필 설정 페이지로, 아니면 메인 페이지로
          setTimeout(() => {
            if (requiresProfileSetup || !tokenInfo.profileCompleted) {
              router.push('/signup/profile-type')
            } else {
              router.push('/')
            }
          }, 1000)
        } else {
          throw new Error('토큰 발급에 실패했습니다.')
        }
      } catch (error: any) {
        logError('OAuth 콜백 처리 실패', error)
        setStatus('error')
        setErrorMessage(error?.response?.data?.message || error?.message || '로그인에 실패했습니다')
        showErrorToast(error, '로그인에 실패했습니다')
      }
    }

    handleAuthCallback()
  }, [searchParams, router, setUser, setAccessToken])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full mx-4">
        {status === 'loading' && (
          <>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900">로그인 처리 중...</h2>
            <p className="text-gray-500 mt-2">잠시만 기다려주세요</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-green-600">로그인 성공!</h2>
            <p className="text-gray-500 mt-2">페이지를 이동합니다...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-600">로그인 실패</h2>
            <p className="text-gray-500 mt-2">{errorMessage}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              로그인 페이지로 이동
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">로그인 처리 중...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
