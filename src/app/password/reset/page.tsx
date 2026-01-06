'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import {
  startPasswordReset,
  sendResetVerificationCode,
  verifyResetCode,
  completePasswordReset,
} from '@/lib/api/password'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'

type Step = 1 | 2 | 3 | 4

interface Step1FormData {
  email: string
}

interface Step2FormData {
  code: string
}

interface Step3FormData {
  newPassword: string
  confirmPassword: string
}

export default function PasswordResetPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [resetToken, setResetToken] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [timer, setTimer] = useState<number>(0)

  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: { errors: errorsStep1 },
  } = useForm<Step1FormData>()

  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    formState: { errors: errorsStep2 },
  } = useForm<Step2FormData>()

  const {
    register: registerStep3,
    handleSubmit: handleSubmitStep3,
    watch,
    formState: { errors: errorsStep3 },
  } = useForm<Step3FormData>()

  const newPassword = watch('newPassword')

  // 1단계: 이메일 입력 및 resetToken 받기
  const onSubmitStep1 = async (data: Step1FormData) => {
    setIsLoading(true)
    try {
      const response = await startPasswordReset({ email: data.email })
      if (response.success && response.data) {
        setResetToken(response.data.resetToken)
        setEmail(data.email)
        showSuccessToast(response.data.message)
        setStep(2)
      }
    } catch (error) {
      showErrorToast(error, '비밀번호 재설정 요청 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  // 2단계: 인증 코드 발송
  const handleSendCode = async () => {
    if (!resetToken || !email) {
      showErrorToast(null, '잘못된 접근입니다')
      return
    }

    setIsLoading(true)
    try {
      await sendResetVerificationCode({ resetToken, email })
      showSuccessToast('인증 코드가 이메일로 전송되었습니다')
      setTimer(300) // 5분 타이머 시작

      // 타이머 감소
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error) {
      showErrorToast(error, '인증 코드 발송 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  // 3단계: 인증 코드 확인
  const onSubmitStep2 = async (data: Step2FormData) => {
    if (!resetToken) {
      showErrorToast(null, '잘못된 접근입니다')
      return
    }

    setIsLoading(true)
    try {
      await verifyResetCode({ resetToken, code: data.code })
      showSuccessToast('인증이 완료되었습니다')
      setStep(3)
    } catch (error) {
      showErrorToast(error, '인증 코드 확인 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  // 4단계: 새 비밀번호 설정
  const onSubmitStep3 = async (data: Step3FormData) => {
    if (!resetToken) {
      showErrorToast(null, '잘못된 접근입니다')
      return
    }

    if (data.newPassword !== data.confirmPassword) {
      showErrorToast(null, '비밀번호가 일치하지 않습니다')
      return
    }

    setIsLoading(true)
    try {
      await completePasswordReset({ resetToken, newPassword: data.newPassword })
      showSuccessToast('비밀번호가 성공적으로 변경되었습니다')
      setStep(4)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error) {
      showErrorToast(error, '비밀번호 변경 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  // 타이머 포맷 (mm:ss)
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">비밀번호 찾기</h1>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 && '가입하신 이메일을 입력해주세요'}
            {step === 2 && '이메일로 받은 인증 코드를 입력해주세요'}
            {step === 3 && '새로운 비밀번호를 설정해주세요'}
            {step === 4 && '비밀번호 변경이 완료되었습니다'}
          </p>
        </div>

        {/* 진행 단계 표시 */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? 'bg-primary text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > s ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>이메일 입력</span>
            <span>인증 확인</span>
            <span>비밀번호 설정</span>
          </div>
        </div>

        {/* 폼 영역 */}
        <div className="bg-white shadow-md rounded-lg p-8">
          {/* 1단계: 이메일 입력 */}
          {step === 1 && (
            <form onSubmit={handleSubmitStep1(onSubmitStep1)} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <input
                  id="email"
                  type="email"
                  {...registerStep1('email', {
                    required: '이메일을 입력해주세요',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: '올바른 이메일 형식이 아닙니다',
                    },
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="example@email.com"
                />
                {errorsStep1.email && (
                  <p className="mt-1 text-sm text-red-600">{errorsStep1.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '처리 중...' : '다음'}
              </button>
            </form>
          )}

          {/* 2단계: 인증 코드 입력 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-primary-800">
                  <span className="font-semibold">{email}</span> 으로 인증 코드를 발송합니다.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSendCode}
                disabled={isLoading || timer > 0}
                className="w-full py-3 px-4 bg-gray-600 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {timer > 0
                  ? `재전송 (${formatTimer(timer)})`
                  : isLoading
                  ? '발송 중...'
                  : '인증 코드 발송'}
              </button>

              <form onSubmit={handleSubmitStep2(onSubmitStep2)} className="space-y-4 mt-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                    인증 코드 (6자리)
                  </label>
                  <input
                    id="code"
                    type="text"
                    maxLength={6}
                    {...registerStep2('code', {
                      required: '인증 코드를 입력해주세요',
                      pattern: {
                        value: /^[0-9]{6}$/,
                        message: '6자리 숫자를 입력해주세요',
                      },
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-center text-2xl tracking-widest"
                    placeholder="000000"
                  />
                  {errorsStep2.code && (
                    <p className="mt-1 text-sm text-red-600">{errorsStep2.code.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '확인 중...' : '확인'}
                </button>
              </form>
            </div>
          )}

          {/* 3단계: 새 비밀번호 설정 */}
          {step === 3 && (
            <form onSubmit={handleSubmitStep3(onSubmitStep3)} className="space-y-4">
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  새 비밀번호
                </label>
                <input
                  id="newPassword"
                  type="password"
                  {...registerStep3('newPassword', {
                    required: '새 비밀번호를 입력해주세요',
                    pattern: {
                      value: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
                      message: '8자 이상, 영문, 숫자, 특수문자(@$!%*#?&)를 포함해야 합니다',
                    },
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="8자 이상, 영문, 숫자, 특수문자 포함"
                />
                {errorsStep3.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{errorsStep3.newPassword.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  비밀번호 확인
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  {...registerStep3('confirmPassword', {
                    required: '비밀번호 확인을 입력해주세요',
                    validate: (value) =>
                      value === newPassword || '비밀번호가 일치하지 않습니다',
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="비밀번호를 다시 입력하세요"
                />
                {errorsStep3.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errorsStep3.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          )}

          {/* 4단계: 완료 */}
          {step === 4 && (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-10 h-10 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">변경 완료!</h3>
              <p className="text-gray-600 mb-6">
                비밀번호가 성공적으로 변경되었습니다.
                <br />
                잠시 후 로그인 페이지로 이동합니다.
              </p>
              <Link
                href="/login"
                className="inline-block py-3 px-6 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                로그인하러 가기
              </Link>
            </div>
          )}
        </div>

        {/* 하단 링크 */}
        {step < 4 && (
          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-gray-600 hover:text-primary">
              로그인으로 돌아가기
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
