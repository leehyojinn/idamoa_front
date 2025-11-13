'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  sendEmailVerification,
  verifyEmail,
  completeSignup,
} from '@/lib/api/auth'
import { showErrorToast, showSuccessToast, logError } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

// ========================================
// Validation Schema
// ========================================

const verifySchema = z.object({
  code: z.string().length(6, '인증 코드는 6자리입니다'),
})

type VerifyForm = z.infer<typeof verifySchema>

// ========================================
// Component
// ========================================

export default function VerifyPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [signupToken, setSignupToken] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [timer, setTimer] = useState(600) // 10분 = 600초

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
  })

  // 페이지 로드 시 signupToken과 email 가져오기
  useEffect(() => {
    const token = sessionStorage.getItem('signupToken')
    const userEmail = sessionStorage.getItem('signupEmail')

    if (!token || !userEmail) {
      showErrorToast(null, '잘못된 접근입니다')
      router.push('/signup')
      return
    }

    setSignupToken(token)
    setEmail(userEmail)

    // 자동으로 인증 코드 발송
    handleSendCode(token, userEmail)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 타이머
  useEffect(() => {
    if (timer <= 0) return

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [timer])

  // 분:초 포맷
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 인증 코드 발송
  const handleSendCode = async (token: string, userEmail: string) => {
    setIsSending(true)
    try {
      await sendEmailVerification({
        signupToken: token,
        email: userEmail,
      })
      showSuccessToast('인증 코드가 이메일로 발송되었습니다')
      setTimer(600) // 타이머 리셋
    } catch (error: unknown) {
      logError('인증 코드 발송 실패', error)
      showErrorToast(error, '인증 코드 발송에 실패했습니다')
    } finally {
      setIsSending(false)
    }
  }

  // 인증 코드 재발송
  const handleResendCode = () => {
    if (isSending) return
    handleSendCode(signupToken, email)
  }

  // 인증 코드 확인 및 회원가입 완료
  const onSubmit = async (data: VerifyForm) => {
    setIsLoading(true)
    try {
      // 1. 이메일 인증 코드 확인
      await verifyEmail({
        signupToken,
        code: data.code,
      })

      showSuccessToast('이메일 인증이 완료되었습니다')

      // 2. 회원가입 완료 (User 생성)
      const response = await completeSignup({
        signupToken,
      })

      // 3. Access Token 저장 (Refresh Token은 httpOnly 쿠키로 자동 저장)
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken)
      }

      // 4. signupToken 제거
      sessionStorage.removeItem('signupToken')
      sessionStorage.removeItem('signupEmail')

      // 5. 프로필 타입 선택 페이지로 이동
      showSuccessToast('회원가입이 완료되었습니다. 프로필을 설정해주세요')
      router.push('/signup/profile-type')
    } catch (error: unknown) {
      logError('인증 실패', error)
      showErrorToast(error, '인증에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar showQuickmenu={false} />
      <div className="flex-1 flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            이메일 인증
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {email}로 발송된 인증 코드를 입력해주세요
          </p>
        </div>

        {/* Timer */}
        <div className="text-center">
          <p className="text-lg font-semibold text-indigo-600">
            {formatTime(timer)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            인증 코드 유효 시간이 지나면 다시 시도해주세요
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              인증 코드
            </label>
            <input
              {...register('code')}
              type="text"
              id="code"
              maxLength={6}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm text-center text-2xl tracking-widest"
              placeholder="000000"
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? '인증 중...' : '인증하기'}
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={isSending}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {isSending ? '발송 중...' : '인증 코드 재발송'}
            </button>
          </div>
        </form>

        {/* Back Link */}
        <div className="text-center">
          <button
            onClick={() => router.push('/signup')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            이전으로
          </button>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
