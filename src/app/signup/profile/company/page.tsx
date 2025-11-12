'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { createCompanyProfile } from '@/lib/api/profile'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useKakaoAddress } from '@/hooks/useKakaoAddress'

// ========================================
// Validation Schema
// ========================================

const companyProfileSchema = z.object({
  name: z.string().min(1, '업체명을 입력해주세요'),
  description: z.string().optional(),
  primaryPhone: z
    .string()
    .regex(
      /^(0[2-9]{1,2})-?([0-9]{3,4})-?([0-9]{4})$/,
      '유효한 전화번호를 입력해주세요 (예: 02-1234-5678)'
    ),
  email: z.string().email('유효한 이메일을 입력해주세요').optional().or(z.literal('')),
  address: z.string().optional(),
  addressDetail: z.string().optional(),
  postalCode: z.string().optional(),
})

type CompanyProfileForm = z.infer<typeof companyProfileSchema>

// ========================================
// Component
// ========================================

export default function CompanyProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { openAddressSearch } = useKakaoAddress()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CompanyProfileForm>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      name: '',
      description: '',
      primaryPhone: '',
      email: '',
      address: '',
      addressDetail: '',
      postalCode: '',
    },
  })

  const handleAddressSearch = () => {
    openAddressSearch((data) => {
      setValue('address', data.address)
      setValue('postalCode', data.zonecode)
    })
  }

  const onSubmit = async (data: CompanyProfileForm) => {
    setIsLoading(true)
    try {
      // 주소와 상세주소 합치기
      const fullAddress = data.address && data.addressDetail
        ? `${data.address}, ${data.addressDetail}`
        : data.address || undefined

      await createCompanyProfile({
        name: data.name,
        description: data.description || undefined,
        primaryPhone: data.primaryPhone,
        email: data.email || undefined,
        address: fullAddress,
        postalCode: data.postalCode || undefined,
      })

      toast.success('업체 프로필이 생성되었습니다!')
      router.push('/') // 메인 페이지로 이동
    } catch (error: unknown) {
      logError('프로필 생성 실패', error)
      showErrorToast(error, '프로필 생성 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar showQuickmenu={false} />
      <div className="flex-1 flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            업체 프로필 설정
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            업체 정보를 입력해주세요
          </p>
        </div>

        {/* Form */}
        <form
          className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="space-y-4">
            {/* Company Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                업체명 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="홍길동 인테리어"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                업체 소개
              </label>
              <textarea
                {...register('description')}
                id="description"
                rows={4}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="10년 경력의 전문 인테리어입니다"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Primary Phone */}
            <div>
              <label
                htmlFor="primaryPhone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                대표 전화번호 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('primaryPhone')}
                type="tel"
                id="primaryPhone"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="02-1234-5678"
              />
              {errors.primaryPhone && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.primaryPhone.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                업체 이메일
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="contact@company.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
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
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
                업체 주소
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
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="동, 호수 등 상세 주소를 입력하세요"
              />
              {errors.addressDetail && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.addressDetail.message}
                </p>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
            <p className="text-sm text-purple-800">
              업체 프로필을 생성하면 자동으로 <strong>업체 회원</strong>으로
              전환됩니다.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? '처리 중...' : '업체 프로필 생성하기'}
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
