'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { createUserProfile } from '@/lib/api/profile'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useKakaoAddress } from '@/hooks/useKakaoAddress'
import { logError, showErrorToast } from '@/lib/errorHandler'
import { formatPhoneNumber, removePhoneHyphens } from '@/lib/utils'

// ========================================
// Validation Schema
// ========================================

const userProfileSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  nickname: z.string().optional(),
  phone: z
    .string()
    .min(1, '전화번호를 입력해주세요')
    .regex(
      /^(01[0-9]|02|0[3-9][0-9]|070)-?([0-9]{3,4})-?([0-9]{4})$/,
      '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678, 02-1234-5678, 031-123-4567)'
    ),
  bio: z.string().optional(),
  address: z.string().optional(),
  addressDetail: z.string().optional(),
  postalCode: z.string().optional(),
})

type UserProfileForm = z.infer<typeof userProfileSchema>

// ========================================
// Component
// ========================================

export default function UserProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const { openAddressSearch } = useKakaoAddress()

  // 로그인 및 프로필 상태 체크
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        showErrorToast(null, '로그인이 필요한 페이지입니다')
        router.push('/login')
        return
      }

      // 프로필 완성 여부 확인
      try {
        const { getProfileStatus } = await import('@/lib/api/profile')
        const response = await getProfileStatus()

        if (response.data.profileCompleted) {
          showErrorToast(null, '이미 프로필이 등록되어 있습니다')
          router.push('/mypage')
          return
        }
      } catch (error) {
        // 프로필 상태 확인 실패 시 계속 진행
      }

      setIsCheckingAuth(false)
    }
    checkAuth()
  }, [router])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserProfileForm>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      name: '',
      nickname: '',
      phone: '',
      bio: '',
      address: '',
      addressDetail: '',
      postalCode: '',
    },
    shouldFocusError: true,
  })

  const phoneValue = watch('phone')

  const handleAddressSearch = () => {
    openAddressSearch((data) => {
      setValue('address', data.address)
      setValue('postalCode', data.zonecode)
    })
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setValue('phone', formatted, { shouldValidate: true })
  }

  const onValidationError = () => {
    const firstError = Object.values(errors)[0]
    if (firstError?.message) {
      showErrorToast(null, firstError.message)
    } else {
      showErrorToast(null, '입력 정보를 확인해주세요')
    }
  }

  const onSubmit = async (data: UserProfileForm) => {
    setIsLoading(true)
    try {
      // 주소와 상세주소 합치기
      const fullAddress = data.address && data.addressDetail
        ? `${data.address}, ${data.addressDetail}`
        : data.address || undefined

      await createUserProfile({
        name: data.name,
        nickname: data.nickname || undefined,
        phone: removePhoneHyphens(data.phone), // 하이픈 제거
        bio: data.bio || undefined,
        address: fullAddress,
        postalCode: data.postalCode || undefined,
      })

      toast.success('프로필이 생성되었습니다!')
      router.push('/') // 메인 페이지로 이동
    } catch (error: unknown) {
      logError('프로필 생성 실패', error)

      // 에러 메시지 추출
      let errorMessage = '프로필 생성 중 오류가 발생했습니다'

      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { message?: string; error?: string } } }
        const responseMessage = apiError.response?.data?.message || apiError.response?.data?.error
        if (responseMessage) {
          errorMessage = responseMessage
        }
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage
      }

      showErrorToast(error, errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // 로딩 중
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
      <div className="flex-1 flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            프로필 설정
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            일반 사용자 프로필 정보를 입력해주세요
          </p>
        </div>

        {/* Form */}
        <form
          className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow"
          onSubmit={handleSubmit(onSubmit, onValidationError)}
        >
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="홍길동"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Nickname */}
            <div>
              <label
                htmlFor="nickname"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                닉네임
              </label>
              <input
                {...register('nickname')}
                type="text"
                id="nickname"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="길동이"
              />
              {errors.nickname && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.nickname.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                전화번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={phoneValue || ''}
                onChange={handlePhoneChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="02-1234-5678 또는 010-1234-5678"
                maxLength={13}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.phone.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                휴대폰 또는 일반 전화번호를 입력하면 자동으로 하이픈이 추가됩니다
              </p>
            </div>

            {/* Bio */}
            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                자기소개
              </label>
              <textarea
                {...register('bio')}
                id="bio"
                rows={3}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="안녕하세요!"
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
              )}
            </div>

            {/* Postal Code & Address Search */}
            <div>
              <label
                htmlFor="postalCode"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                우편번호
              </label>
              <div className="flex gap-2">
                <input
                  {...register('postalCode')}
                  type="text"
                  id="postalCode"
                  readOnly
                  className="appearance-none relative block w-32 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md bg-gray-50 focus:outline-none sm:text-sm"
                  placeholder="우편번호"
                />
                <button
                  type="button"
                  onClick={handleAddressSearch}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  주소 검색
                </button>
              </div>
              {errors.postalCode && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.postalCode.message}
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                주소
              </label>
              <input
                {...register('address')}
                type="text"
                id="address"
                readOnly
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md bg-gray-50 focus:outline-none sm:text-sm"
                placeholder="주소 검색 버튼을 클릭하세요"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.address.message}
                </p>
              )}
            </div>

            {/* Address Detail */}
            <div>
              <label
                htmlFor="addressDetail"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                상세 주소
              </label>
              <input
                {...register('addressDetail')}
                type="text"
                id="addressDetail"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="동, 호수 등 상세 주소를 입력하세요"
              />
              {errors.addressDetail && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.addressDetail.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? '처리 중...' : '프로필 생성하기'}
            </button>
          </div>

          {/* Back Button */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              이전으로
            </button>
          </div>
        </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}
