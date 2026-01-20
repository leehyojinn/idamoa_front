'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import {
  login,
  getKakaoAuthUrl,
  getNaverAuthUrl,
  getGoogleAuthUrl,
} from '@/lib/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { showErrorToast, showSuccessToast, logError } from '@/lib/errorHandler'
import { usePasswordResetStore } from '@/stores/usePasswordResetStore'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

// ========================================
// Validation Schema
// ========================================

const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

type LoginForm = z.infer<typeof loginSchema>

// ========================================
// Helper Functions
// ========================================

/**
 * redirectUrl이 안전한 내부 경로인지 검증
 * Open Redirect 공격 방지
 */
const isValidRedirectUrl = (url: string): boolean => {
  try {
    const decoded = decodeURIComponent(url)

    // 반드시 /로 시작해야 함 (상대 경로)
    if (!decoded.startsWith('/')) {
      return false
    }

    // //로 시작하면 안됨 (프로토콜 상대 URL)
    if (decoded.startsWith('//')) {
      return false
    }

    // javascript: 스킴 차단
    if (decoded.toLowerCase().includes('javascript:')) {
      return false
    }

    // data: 스킴 차단
    if (decoded.toLowerCase().includes('data:')) {
      return false
    }

    // URL 파싱해서 외부 호스트가 포함되어 있는지 확인
    // 예: /foo@evil.com, /foo?url=http://evil.com
    const testUrl = new URL(decoded, 'http://localhost')
    if (testUrl.host !== 'localhost') {
      return false
    }

    return true
  } catch {
    return false
  }
}

// ========================================
// Component
// ========================================

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect')
  const [isLoading, setIsLoading] = useState(false)
  const setUser = useAuthStore((state) => state.setUser)
  const setAccessToken = useAuthStore((state) => state.setAccessToken)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const _hasHydrated = useAuthStore((state) => state._hasHydrated)
  const openPasswordResetModal = usePasswordResetStore((state) => state.openModal)

  // 이미 로그인된 상태면 메인 페이지로 리다이렉트
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      toast('이미 로그인되어 있습니다.', { icon: 'ℹ️' })
      router.replace('/')
    }
  }, [_hasHydrated, isAuthenticated, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const response = await login({
        email: data.email,
        password: data.password,
      })

      if (response.success) {
        // ✅ Access Token을 메모리에만 저장 (Refresh Token은 httpOnly 쿠키로 자동 저장)
        if (response.data.accessToken) {
          setAccessToken(response.data.accessToken)
        }

        // 사용자 정보 저장
        setUser({
          email: data.email,
          profileCompleted: response.data.profileCompleted,
          currentRole: response.data.currentRole,
        })

        showSuccessToast('로그인 성공!')

        // 프로필 완성 여부에 따라 리다이렉트
        if (!response.data.profileCompleted) {
          router.push('/signup/profile-type')
        } else if (redirectUrl && isValidRedirectUrl(redirectUrl)) {
          // 세션 만료로 리다이렉트된 경우 원래 페이지로 이동 (검증된 URL만)
          router.push(decodeURIComponent(redirectUrl))
        } else {
          router.push('/')
        }
      }
    } catch (error: unknown) {
      logError('로그인 실패', error)
      showErrorToast(error, '로그인에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'naver' | 'kakao') => {
    try {
      let response
      switch (provider) {
        case 'google':
          response = await getGoogleAuthUrl()
          break
        case 'naver':
          response = await getNaverAuthUrl()
          break
        case 'kakao':
          response = await getKakaoAuthUrl()
          break
      }

      if (response.success && response.data.authorizationUrl) {
        // OAuth 인가 페이지로 리다이렉트
        window.location.href = response.data.authorizationUrl
      }
    } catch (error: unknown) {
      logError(`${provider} 로그인 실패`, error)
      showErrorToast(error, '로그인에 실패했습니다. 다시 시도해주세요')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar showQuickmenu={false} />
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="mt-6 text-4xl font-extrabold text-gray-900">
              로그인
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              다모아에 오신 것을 환영합니다
            </p>
          </div>

          {/* Form */}
          <form
            className="mt-8 space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-gray-100"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  이메일
                </label>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all sm:text-sm"
                  placeholder="example@email.com"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  비밀번호
                </label>
                <input
                  {...register('password')}
                  type="password"
                  id="password"
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all sm:text-sm"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={openPasswordResetModal}
                className="text-sm font-medium text-primary hover:text-primary-700 transition-colors"
              >
                비밀번호를 잊으셨나요?
              </button>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    로그인 중...
                  </span>
                ) : (
                  '로그인'
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">또는</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3">
              {/* Google Login */}
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl font-bold text-gray-700 bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
              >
                <Image
                  src="/images/social/logo-google.svg"
                  alt="google"
                  width={20}
                  height={20}
                  className="w-4 h-4 mr-3"
                />
                구글 계정으로 로그인
              </button>

              {/* Naver Login */}
              <button
                type="button"
                onClick={() => handleSocialLogin('naver')}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl font-bold text-white bg-[#03c75a] hover:bg-[#02b351] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
              >
                <Image
                  src="/images/social/logo-naver-background.svg"
                  alt="naver"
                  width={20}
                  height={20}
                  className="w-8 h-8"
                />
                네이버 계정으로 로그인
              </button>

              {/* Kakao Login */}
              <button
                type="button"
                onClick={() => handleSocialLogin('kakao')}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl font-bold text-gray-900 bg-[#fee500] hover:bg-[#fdd835] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
              >
                <Image
                  src="/images/social/logo-kakao.svg"
                  alt="kakao"
                  width={20}
                  height={20}
                  className="w-4 h-4"
                />
                카카오 계정으로 로그인
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                아직 계정이 없으신가요?{' '}
                <Link
                  href="/signup"
                  className="font-bold text-primary hover:text-primary-700 transition-colors"
                >
                  회원가입
                </Link>
              </p>
            </div>
          </form>

          {/* Info Box */}
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
            <p className="text-xs text-primary-800 text-center">
              로그인하면 다모아의 모든 서비스를 이용하실 수 있습니다
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
