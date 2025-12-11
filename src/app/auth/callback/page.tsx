'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { exchangeOAuthCode } from '@/lib/api/auth'
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
        // URL에서 code 파라미터 추출 (백엔드 OAuth 콜백에서 전달받은 임시 코드)
        const code = searchParams.get('code')
        const error = searchParams.get('error')

        // 에러가 있으면 에러 처리
        if (error) {
          throw new Error(decodeURIComponent(error))
        }

        // 코드가 없으면 에러
        if (!code) {
          throw new Error('인증 코드가 없습니다.')
        }

        // 임시 코드를 토큰으로 교환 (POST /api/oauth/token)
        const response = await exchangeOAuthCode(code)

        if (response.success && response.data) {
          const { isNewUser, tokenInfo, providerEmail } = response.data

          // Access Token 저장
          setAccessToken(tokenInfo.accessToken)

          // 사용자 정보 저장
          setUser({
            email: providerEmail,
            profileCompleted: tokenInfo.profileCompleted,
            currentRole: tokenInfo.currentRole,
          })

          setStatus('success')
          showSuccessToast('로그인 성공!')

          // 신규 가입자이거나 프로필 미완성인 경우 프로필 설정 페이지로 이동
          setTimeout(() => {
            if (isNewUser || !tokenInfo.profileCompleted) {
              router.push('/signup/profile-type')
            } else {
              router.push('/')
            }
          }, 1000)
        } else {
          throw new Error(response.message || '토큰 발급에 실패했습니다.')
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
