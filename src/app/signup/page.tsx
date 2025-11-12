'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { signupStart } from '@/lib/api/auth'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Checkbox from '@/components/ui/Checkbox'

// 메타데이터는 Server Component에서만 가능하므로 별도 파일로 분리

// ========================================
// Validation Schema
// ========================================

const signupSchema = z
  .object({
    email: z.string().email('유효한 이메일을 입력해주세요'),
    password: z
      .string()
      .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
      .regex(
        /^(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[a-z\d@$!%*?&]/i,
        '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다'
      ),
    passwordConfirm: z.string(),
    termsAgreed: z.boolean().refine((val) => val === true, {
      message: '이용약관에 동의해주세요',
    }),
    privacyAgreed: z.boolean().refine((val) => val === true, {
      message: '개인정보 처리방침에 동의해주세요',
    }),
    marketingAgreed: z.boolean().optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['passwordConfirm'],
  })

type SignupForm = z.infer<typeof signupSchema>

// ========================================
// Component
// ========================================

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [allAgreed, setAllAgreed] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      passwordConfirm: '',
      termsAgreed: false,
      privacyAgreed: false,
      marketingAgreed: false,
    },
  })

  // 체크박스 상태 관찰
  const termsAgreed = watch('termsAgreed') ?? false
  const privacyAgreed = watch('privacyAgreed') ?? false
  const marketingAgreed = watch('marketingAgreed') ?? false

  // 전체 선택 상태 업데이트
  useEffect(() => {
    if (termsAgreed && privacyAgreed && marketingAgreed) {
      setAllAgreed(true)
    } else {
      setAllAgreed(false)
    }
  }, [termsAgreed, privacyAgreed, marketingAgreed])

  // 전체 선택 핸들러
  const handleAllAgree = (checked: boolean) => {
    setAllAgreed(checked)
    setValue('termsAgreed', checked)
    setValue('privacyAgreed', checked)
    setValue('marketingAgreed', checked)
  }

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true)
    try {
      const response = await signupStart({
        email: data.email,
        password: data.password,
        termsAgreed: data.termsAgreed,
        privacyAgreed: data.privacyAgreed,
        marketingAgreed: data.marketingAgreed || false,
      })

      // signupToken을 sessionStorage에 저장
      sessionStorage.setItem('signupToken', response.data.signupToken)
      sessionStorage.setItem('signupEmail', data.email)

      toast.success('이메일 인증을 진행해주세요')
      router.push('/signup/verify')
    } catch (error: any) {
      console.error('회원가입 시작 실패:', error)
      toast.error(
        error.response?.data?.message || '회원가입 중 오류가 발생했습니다'
      )
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
              회원가입
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              다모아에 오신 것을 환영합니다
            </p>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="rounded-md shadow-sm space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  이메일
                </label>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="이메일을 입력하세요"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  비밀번호
                </label>
                <input
                  {...register('password')}
                  type="password"
                  id="password"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="비밀번호를 입력하세요"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Password Confirm */}
              <div>
                <label
                  htmlFor="passwordConfirm"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  비밀번호 확인
                </label>
                <input
                  {...register('passwordConfirm')}
                  type="password"
                  id="passwordConfirm"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="비밀번호를 다시 입력하세요"
                />
                {errors.passwordConfirm && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.passwordConfirm.message}
                  </p>
                )}
              </div>
            </div>

            {/* Terms */}
            <div className="space-y-3">
              {/* 전체 선택 */}
              <div className="border-b border-gray-200 pb-2">
                <Checkbox
                  checked={allAgreed}
                  onChange={handleAllAgree}
                  label="전체 동의"
                  size="lg"
                />
              </div>

              {/* 개별 선택 */}
              <div className="space-y-2 pl-1">
                <Checkbox
                  checked={termsAgreed}
                  onChange={(checked) => setValue('termsAgreed', checked)}
                  label="[필수] 이용약관에 동의합니다"
                  error={errors.termsAgreed?.message}
                />

                <Checkbox
                  checked={privacyAgreed}
                  onChange={(checked) => setValue('privacyAgreed', checked)}
                  label="[필수] 개인정보 처리방침에 동의합니다"
                  error={errors.privacyAgreed?.message}
                />

                <Checkbox
                  checked={marketingAgreed}
                  onChange={(checked) => setValue('marketingAgreed', checked)}
                  label="[선택] 마케팅 정보 수신에 동의합니다"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? '처리 중...' : '다음'}
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{' '}
                <a
                  href="/login"
                  className="font-medium text-primary hover:text-secondary"
                >
                  로그인
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}
