'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { changePassword } from '@/lib/api/password'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { useDialog } from '@/hooks/useDialog'
import { useAuthStore } from '@/stores/authStore'

interface PasswordChangeFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function PasswordChangePage() {
  const router = useRouter()
  const { alert } = useDialog()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const { accessToken, _hasHydrated } = useAuthStore()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordChangeFormData>()

  const newPassword = watch('newPassword')

  // 인증 체크 - localStorage hydration 완료 대기
  useEffect(() => {
    if (!_hasHydrated) return // localStorage 로딩 대기

    if (!accessToken) {
      showErrorToast(null, '로그인이 필요한 페이지입니다')
      router.push('/login')
      return
    }
    setIsCheckingAuth(false)
  }, [router, accessToken, _hasHydrated])

  const onSubmit = async (data: PasswordChangeFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      showErrorToast(null, '새 비밀번호가 일치하지 않습니다')
      return
    }

    if (data.currentPassword === data.newPassword) {
      showErrorToast(null, '현재 비밀번호와 새 비밀번호가 동일합니다')
      return
    }

    setIsLoading(true)
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })

      reset()

      alert('비밀번호가 성공적으로 변경되었습니다.', {
        title: '변경 완료',
        onConfirm: () => {
          router.push('/mypage')
        },
      })
    } catch (error) {
      showErrorToast(error, '비밀번호 변경 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  // 로그인 체크 중
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar showQuickmenu={false} />

      <main className="flex-1 bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">비밀번호 변경</h1>
            <p className="mt-2 text-sm text-gray-600">
              보안을 위해 주기적으로 비밀번호를 변경해주세요
            </p>
          </div>

          <div className="bg-white shadow-md rounded-lg p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 현재 비밀번호 */}
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  현재 비밀번호 <span className="text-red-500">*</span>
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  {...register('currentPassword', {
                    required: '현재 비밀번호를 입력해주세요',
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="현재 사용 중인 비밀번호"
                />
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>
                )}
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">새 비밀번호</h3>

                {/* 새 비밀번호 */}
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      새 비밀번호 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      {...register('newPassword', {
                        required: '새 비밀번호를 입력해주세요',
                        pattern: {
                          value: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
                          message: '8자 이상, 영문, 숫자, 특수문자(@$!%*#?&)를 포함해야 합니다',
                        },
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="8자 이상, 영문, 숫자, 특수문자 포함"
                    />
                    {errors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      영문, 숫자, 특수문자(@$!%*#?&)를 포함하여 8자 이상 입력해주세요
                    </p>
                  </div>

                  {/* 비밀번호 확인 */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      새 비밀번호 확인 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      {...register('confirmPassword', {
                        required: '새 비밀번호를 다시 입력해주세요',
                        validate: (value) =>
                          value === newPassword || '비밀번호가 일치하지 않습니다',
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="새 비밀번호를 다시 입력하세요"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 버튼 영역 */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => router.push('/mypage')}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '변경 중...' : '비밀번호 변경'}
                </button>
              </div>
            </form>

            {/* 안내 사항 */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">비밀번호 변경 안내</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• 안전한 비밀번호를 위해 영문, 숫자, 특수문자를 조합해주세요</li>
                <li>• 개인정보(이름, 생일 등)가 포함되지 않도록 주의해주세요</li>
                <li>• 다른 사이트와 동일한 비밀번호 사용을 피해주세요</li>
                <li>• 주기적으로 비밀번호를 변경하는 것을 권장합니다</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
