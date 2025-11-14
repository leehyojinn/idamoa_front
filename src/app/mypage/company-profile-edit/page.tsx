'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useProfile, useUpdateCompanyProfile } from '@/hooks/useProfile'
import { useKakaoAddress } from '@/hooks/useKakaoAddress'
import { showErrorToast } from '@/lib/errorHandler'
import { useDialog } from '@/hooks/useDialog'
import type { UpdateCompanyProfileRequest } from '@/lib/api/profile'

interface CompanyProfileFormData {
  name: string
  description?: string
  address?: string
  addressDetail?: string
  postalCode?: string
}

export default function CompanyProfileEditPage() {
  const router = useRouter()
  const { alert } = useDialog()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const { openAddressSearch, isScriptLoaded } = useKakaoAddress()

  // 프로필 정보 조회
  const { data: profileResponse, isLoading: profileLoading } = useProfile()
  const updateProfileMutation = useUpdateCompanyProfile()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CompanyProfileFormData>()

  // 로그인 체크
  useEffect(() => {
    const checkAuth = () => {
      const accessToken = localStorage.getItem('accessToken')

      if (!accessToken) {
        showErrorToast(null, '로그인이 필요한 페이지입니다')
        router.push('/login')
        return
      }

      setIsCheckingAuth(false)
    }

    checkAuth()
  }, [router])

  // 프로필 데이터 로드 후 폼 초기화
  useEffect(() => {
    if (profileResponse?.data) {
      const profile = profileResponse.data

      // COMPANY 프로필이 아닌 경우 마이페이지로 이동
      if (profile.profileType !== 'COMPANY') {
        showErrorToast(null, '업체 프로필만 수정할 수 있습니다')
        router.push('/mypage')
        return
      }

      // 주소에서 쉼표로 구분된 상세주소 분리
      let mainAddress = profile.address || ''
      let detailAddress = ''
      if (profile.address && profile.address.includes(',')) {
        const parts = profile.address.split(',')
        mainAddress = parts[0].trim()
        detailAddress = parts.slice(1).join(',').trim()
      }

      reset({
        name: profile.name,
        description: profile.bio || '',
        address: mainAddress,
        addressDetail: detailAddress,
        postalCode: profile.postalCode || '',
      })
    }
  }, [profileResponse, reset, router])

  // 카카오 주소 검색
  const handleAddressSearch = () => {
    openAddressSearch((data) => {
      setValue('address', data.address)
      setValue('postalCode', data.zonecode)
    })
  }

  const onSubmit = async (data: CompanyProfileFormData) => {
    try {
      // 주소와 상세주소를 쉼표로 합치기
      const fullAddress = data.address && data.addressDetail
        ? `${data.address}, ${data.addressDetail}`
        : data.address || ''

      // 업체명, 업체소개, 주소만 수정
      const updateData: UpdateCompanyProfileRequest = {
        name: data.name,
        description: data.description || '',
        address: fullAddress,
        postalCode: data.postalCode || '',
      }

      await updateProfileMutation.mutateAsync(updateData)

      alert('업체 기본 정보가 성공적으로 수정되었습니다.', {
        title: '수정 완료',
        onConfirm: () => {
          router.push('/mypage')
        },
      })
    } catch (error) {
      showErrorToast(error, '업체 정보 수정 중 오류가 발생했습니다')
    }
  }

  // 로딩 중
  if (isCheckingAuth || profileLoading) {
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
            <h1 className="text-3xl font-bold text-gray-900">업체 기본 정보 수정</h1>
            <p className="mt-2 text-sm text-gray-600">
              업체의 기본 정보를 수정할 수 있습니다
            </p>
            <p className="mt-1 text-xs text-gray-500">
              상세 정보는 &quot;업체 상세정보 수정&quot; 메뉴에서 수정할 수 있습니다
            </p>
          </div>

          <div className="bg-white shadow-md rounded-lg p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 업체명 */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  업체명 <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name', {
                    required: '업체명을 입력해주세요',
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="업체명"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* 업체 소개 */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  업체 소개
                </label>
                <textarea
                  id="description"
                  {...register('description')}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="업체 소개를 입력해주세요"
                />
              </div>

              {/* 우편번호 (hidden) */}
              <input
                type="hidden"
                {...register('postalCode')}
              />

              {/* 주소 */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  업체 주소
                </label>
                <div className="flex gap-2">
                  <input
                    id="address"
                    type="text"
                    {...register('address')}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50"
                    placeholder="주소 검색 버튼을 클릭하세요"
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={handleAddressSearch}
                    disabled={!isScriptLoaded}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isScriptLoaded ? '주소 검색' : '로딩 중...'}
                  </button>
                </div>
                {!isScriptLoaded && (
                  <p className="mt-1 text-xs text-gray-500">
                    주소 검색 기능을 준비하고 있습니다...
                  </p>
                )}
              </div>

              {/* 상세주소 */}
              <div>
                <label
                  htmlFor="addressDetail"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  상세주소
                </label>
                <input
                  id="addressDetail"
                  type="text"
                  {...register('addressDetail')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="상세주소를 입력하세요 (예: 101동 201호)"
                />
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
                  disabled={updateProfileMutation.isPending}
                  className="flex-1 py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateProfileMutation.isPending ? '수정 중...' : '기본 정보 수정'}
                </button>
              </div>
            </form>

            {/* 안내 사항 */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">수정 안내</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• 업체명은 필수 입력 항목입니다</li>
                <li>• 주소는 &quot;주소 검색&quot; 버튼을 통해 정확한 주소를 입력할 수 있습니다</li>
                <li>• 전화번호, 이메일 등 상세 정보는 &quot;업체 상세정보 수정&quot;에서 수정하세요</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
