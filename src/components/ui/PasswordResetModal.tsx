'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FaTimes, FaEnvelope, FaLock, FaCheckCircle, FaShieldAlt, FaExclamationCircle } from 'react-icons/fa'
import {
  startPasswordReset,
  sendResetVerificationCode,
  verifyResetCode,
  completePasswordReset,
} from '@/lib/api/password'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { usePasswordResetStore } from '@/stores/usePasswordResetStore'

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

export default function PasswordResetModal() {
  const { isOpen, closeModal } = usePasswordResetStore()
  const [step, setStep] = useState<Step>(1)
  const [resetToken, setResetToken] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [timer, setTimer] = useState<number>(0)

  // 드래그 관련 상태
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    reset: resetStep1,
    formState: { errors: errorsStep1 },
  } = useForm<Step1FormData>()

  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    reset: resetStep2,
    formState: { errors: errorsStep2 },
  } = useForm<Step2FormData>()

  const {
    register: registerStep3,
    handleSubmit: handleSubmitStep3,
    watch,
    reset: resetStep3,
    formState: { errors: errorsStep3 },
  } = useForm<Step3FormData>()

  const newPassword = watch('newPassword')

  // 비밀번호 강도 체크
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' }

    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[@$!%*#?&]/.test(password)) strength++

    if (strength <= 1) return { strength: 25, label: '약함', color: 'bg-red-500' }
    if (strength === 2) return { strength: 50, label: '보통', color: 'bg-yellow-500' }
    if (strength === 3) return { strength: 75, label: '강함', color: 'bg-primary-800' }
    return { strength: 100, label: '매우 강함', color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength(newPassword || '')

  // 모달이 닫힐 때 초기화
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1)
        setResetToken('')
        setEmail('')
        setTimer(0)
        setPosition({ x: 0, y: 0 })
        resetStep1()
        resetStep2()
        resetStep3()
      }, 300)
    }
  }, [isOpen, resetStep1, resetStep2, resetStep3])

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, closeModal])

  // 드래그 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x
        const newY = e.clientY - dragStart.y
        setPosition({ x: newX, y: newY })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart])

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
        closeModal()
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={closeModal}
      />

      {/* 모달 */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 animate-scaleIn max-h-[90vh] overflow-hidden flex flex-col"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {/* 헤더 - 그라데이션 배경 (드래그 핸들) */}
        <div
          className="sticky top-0 bg-gradient-to-r from-primary to-indigo-600 px-6 py-5 flex items-center justify-between rounded-t-3xl z-10 cursor-move select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <FaShieldAlt className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">비밀번호 찾기</h2>
          </div>
          <button
            onClick={closeModal}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-2 hover:bg-white/20 rounded-full transition-all transform hover:rotate-90 duration-300"
            aria-label="닫기"
          >
            <FaTimes className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* 진행 단계 표시 - 개선된 디자인 */}
        <div className="px-6 py-6 bg-gradient-to-b from-primary-50 to-white">
          <div className="flex justify-between items-center relative">
            {/* 연결선 배경 */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full" style={{ width: 'calc(100% - 40px)', left: '20px' }} />
            <div
              className="absolute top-5 left-0 h-1 bg-gradient-to-r from-primary to-indigo-600 rounded-full transition-all duration-500"
              style={{
                width: step === 1 ? '0%' : step === 2 ? 'calc(50% - 20px)' : 'calc(100% - 40px)',
                left: '20px'
              }}
            />

            {[
              { num: 1, icon: FaEnvelope, label: '이메일 확인' },
              { num: 2, icon: FaCheckCircle, label: '인증 코드' },
              { num: 3, icon: FaLock, label: '비밀번호 설정' }
            ].map(({ num, icon: Icon, label }) => (
              <div key={num} className="flex flex-col items-center flex-1 relative z-10">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 transform ${
                    step >= num
                      ? 'bg-gradient-to-br from-primary to-indigo-600 text-white shadow-lg scale-110'
                      : 'bg-white border-2 border-gray-300 text-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`mt-2 text-xs font-medium transition-colors ${
                  step >= num ? 'text-primary' : 'text-gray-500'
                }`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 컨텐츠 - 스크롤 가능 영역 */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* 1단계: 이메일 입력 */}
          {step === 1 && (
            <div className="animate-slideIn">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaEnvelope className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">이메일 주소 확인</h3>
                <p className="text-sm text-gray-600">
                  가입하신 이메일 주소를 입력하시면<br />비밀번호 재설정 링크를 보내드립니다
                </p>
              </div>

              <form onSubmit={handleSubmitStep1(onSubmitStep1)} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    이메일 주소
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-400" />
                    </div>
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
                      className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-primary-500 transition-all ${
                        errorsStep1.email ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:bg-white'
                      }`}
                      placeholder="example@email.com"
                    />
                  </div>
                  {errorsStep1.email && (
                    <div className="mt-2 flex items-center gap-1 text-sm text-red-600 animate-shake">
                      <FaExclamationCircle className="w-4 h-4" />
                      <p>{errorsStep1.email.message}</p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl font-bold hover:from-primary-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      처리 중...
                    </span>
                  ) : '다음 단계로'}
                </button>
              </form>
            </div>
          )}

          {/* 2단계: 인증 코드 입력 */}
          {step === 2 && (
            <div className="animate-slideIn">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">이메일 인증</h3>
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 border-2 border-primary-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-primary">
                    <span className="font-bold text-primary">{email}</span><br />
                    위 이메일로 인증 코드를 발송합니다
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isLoading || timer > 0}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl font-bold hover:from-gray-800 hover:to-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {timer > 0 ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      재전송 가능 ({formatTimer(timer)})
                    </span>
                  ) : isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      발송 중...
                    </span>
                  ) : '인증 코드 발송'}
                </button>

                {timer > 0 && (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 text-center animate-pulse">
                    <p className="text-sm text-yellow-900">
                      인증 코드가 발송되었습니다. 이메일을 확인해주세요!
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmitStep2(onSubmitStep2)} className="space-y-5 mt-6">
                  <div>
                    <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
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
                      className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-primary-500 text-center text-3xl font-bold tracking-[0.5em] transition-all ${
                        errorsStep2.code ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:bg-white'
                      }`}
                      placeholder="000000"
                    />
                    {errorsStep2.code && (
                      <div className="mt-2 flex items-center gap-1 text-sm text-red-600 animate-shake">
                        <FaExclamationCircle className="w-4 h-4" />
                        <p>{errorsStep2.code.message}</p>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl font-bold hover:from-primary-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        확인 중...
                      </span>
                    ) : '인증 확인'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 3단계: 새 비밀번호 설정 */}
          {step === 3 && (
            <div className="animate-slideIn">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaLock className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">새 비밀번호 설정</h3>
                <p className="text-sm text-gray-600">
                  안전한 비밀번호로 설정해주세요
                </p>
              </div>

              <form onSubmit={handleSubmitStep3(onSubmitStep3)} className="space-y-5">
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    새 비밀번호
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaLock className="text-gray-400" />
                    </div>
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
                      className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-primary-500 transition-all ${
                        errorsStep3.newPassword ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:bg-white'
                      }`}
                      placeholder="8자 이상, 영문, 숫자, 특수문자 포함"
                    />
                  </div>

                  {/* 비밀번호 강도 표시 */}
                  {newPassword && newPassword.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">비밀번호 강도</span>
                        <span className={`text-xs font-bold ${
                          passwordStrength.strength === 100 ? 'text-green-600' :
                          passwordStrength.strength === 75 ? 'text-primary' :
                          passwordStrength.strength === 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{ width: `${passwordStrength.strength}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {errorsStep3.newPassword && (
                    <div className="mt-2 flex items-center gap-1 text-sm text-red-600 animate-shake">
                      <FaExclamationCircle className="w-4 h-4" />
                      <p>{errorsStep3.newPassword.message}</p>
                    </div>
                  )}

                  <div className="mt-3 space-y-1.5">
                    <p className="text-xs font-semibold text-gray-700">비밀번호 요구사항:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${newPassword?.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`} />
                        최소 8자 이상
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${/[A-Za-z]/.test(newPassword || '') ? 'bg-green-500' : 'bg-gray-300'}`} />
                        영문 포함
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${/\d/.test(newPassword || '') ? 'bg-green-500' : 'bg-gray-300'}`} />
                        숫자 포함
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${/[@$!%*#?&]/.test(newPassword || '') ? 'bg-green-500' : 'bg-gray-300'}`} />
                        특수문자(@$!%*#?&) 포함
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    비밀번호 확인
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaLock className="text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      type="password"
                      {...registerStep3('confirmPassword', {
                        required: '비밀번호 확인을 입력해주세요',
                        validate: (value) => value === newPassword || '비밀번호가 일치하지 않습니다',
                      })}
                      className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-primary-500 transition-all ${
                        errorsStep3.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:bg-white'
                      }`}
                      placeholder="비밀번호를 다시 입력하세요"
                    />
                  </div>
                  {errorsStep3.confirmPassword && (
                    <div className="mt-2 flex items-center gap-1 text-sm text-red-600 animate-shake">
                      <FaExclamationCircle className="w-4 h-4" />
                      <p>{errorsStep3.confirmPassword.message}</p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl font-bold hover:from-primary-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      변경 중...
                    </span>
                  ) : '비밀번호 변경 완료'}
                </button>
              </form>
            </div>
          )}

          {/* 4단계: 완료 */}
          {step === 4 && (
            <div className="text-center py-8 animate-slideIn">
              <div className="mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-bounce-slow">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">변경 완료!</h3>
              <p className="text-gray-600 leading-relaxed">
                비밀번호가 성공적으로 변경되었습니다.
                <br />
                새 비밀번호로 로그인해주세요.
              </p>
              <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-800">
                  잠시 후 자동으로 창이 닫힙니다
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-slideIn {
          animation: slideIn 0.4s ease-out;
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
