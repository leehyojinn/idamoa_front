'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useKakaoAddress } from '@/hooks/useKakaoAddress'
import { useCreateCompany, useUpdateCompany, useMyCompany } from '@/hooks/useCompany'
import { useProfile } from '@/hooks/useProfile'
import type { CompanyRegistrationData } from '@/lib/api/company'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import ImageUpload from '@/components/ui/ImageUpload'

interface FormData {
  // 기본 정보
  name: string
  description: string
  detailContent: string

  // 사업자 정보
  businessRegistrationNumber: string
  representativeName: string
  companyType: string

  // 연락처
  primaryPhone: string
  secondaryPhone: string
  emergencyContact: string
  email: string
  websiteUrl: string
  kakaoChatUrl: string

  // 주소
  address: string
  addressDetail: string
  postalCode: string

  // 영업 정보
  businessHoursNote: string
  mondayHours: string
  tuesdayHours: string
  wednesdayHours: string
  thursdayHours: string
  fridayHours: string
  saturdayHours: string
  sundayHours: string
  serviceAreas: string
  tags: string
  keywords: string
  filterOptionIds: string

  // 통계 정보
  portfolioCount: number
  completedProjects: number

  // SNS 링크
  facebookUrl: string
  instagramUrl: string
  youtubeUrl: string
  blogUrl: string

  // 이미지
  logoImageUrl: string
  coverImageUrl: string
  galleryImageUrls: string[]
}

export default function CompanyRegisterPage() {
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isScriptLoaded, openAddressSearch } = useKakaoAddress()

  // 프로필 정보 가져오기
  const { data: profileResponse, isLoading: profileLoading } = useProfile()

  // 회사 정보 가져오기 (수정 모드용)
  const { data: companyResponse, isLoading: companyLoading } = useMyCompany(true)

  // 이미지 URL 상태 관리
  const [logoImageUrl, setLogoImageUrl] = useState<string>('')
  const [coverImageUrl, setCoverImageUrl] = useState<string>('')
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([])

  // 좌표 상태 관리
  const [latitude, setLatitude] = useState<number | undefined>(undefined)
  const [longitude, setLongitude] = useState<number | undefined>(undefined)

  // React Query mutation
  const createCompanyMutation = useCreateCompany()
  const updateCompanyMutation = useUpdateCompany()
  const isEditMode = !!companyResponse?.data
  const companyUuid = companyResponse?.data?.uuid || ''

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>()

  const address = watch('address')

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

  // 회사 정보를 폼에 자동 입력 (수정 모드)
  useEffect(() => {
    if (companyResponse?.data) {
      const company = companyResponse.data

      // 기본 정보
      if (company.name) setValue('name', company.name)
      if (company.description) setValue('description', company.description)
      if (company.detailContent) setValue('detailContent', company.detailContent)

      // 연락처
      if (company.primaryPhone) setValue('primaryPhone', company.primaryPhone)
      if (company.secondaryPhone) setValue('secondaryPhone', company.secondaryPhone)
      if (company.emergencyContact) setValue('emergencyContact', company.emergencyContact)
      if (company.email) setValue('email', company.email)
      if (company.websiteUrl) setValue('websiteUrl', company.websiteUrl)
      if (company.kakaoChatUrl) setValue('kakaoChatUrl', company.kakaoChatUrl)

      // 주소
      if (company.address) setValue('address', company.address)
      if (company.postalCode) setValue('postalCode', company.postalCode)
      if (company.latitude) setLatitude(company.latitude)
      if (company.longitude) setLongitude(company.longitude)

      // 사업자 정보
      if (company.businessInfo) {
        const businessInfo = company.businessInfo as Record<string, string>
        if (businessInfo.businessRegistrationNumber) setValue('businessRegistrationNumber', businessInfo.businessRegistrationNumber)
        if (businessInfo.representativeName) setValue('representativeName', businessInfo.representativeName)
        if (businessInfo.companyType) setValue('companyType', businessInfo.companyType)
      }

      // 영업시간
      if (company.businessHours) {
        const businessHours = company.businessHours as Record<string, string>
        if (businessHours.monday) setValue('mondayHours', businessHours.monday)
        if (businessHours.tuesday) setValue('tuesdayHours', businessHours.tuesday)
        if (businessHours.wednesday) setValue('wednesdayHours', businessHours.wednesday)
        if (businessHours.thursday) setValue('thursdayHours', businessHours.thursday)
        if (businessHours.friday) setValue('fridayHours', businessHours.friday)
        if (businessHours.saturday) setValue('saturdayHours', businessHours.saturday)
        if (businessHours.sunday) setValue('sundayHours', businessHours.sunday)
      }
      if (company.businessHoursNote) setValue('businessHoursNote', company.businessHoursNote)

      // 서비스 지역, 태그, 키워드
      if (company.serviceAreas) setValue('serviceAreas', company.serviceAreas.join(', '))
      if (company.tags) setValue('tags', company.tags.join(', '))
      if (company.keywords) setValue('keywords', company.keywords.join(', '))

      // 필터 옵션
      if (company.filterOptions) {
        const filterIds = company.filterOptions.map(opt => opt.id).join(', ')
        setValue('filterOptionIds', filterIds)
      }

      // SNS 링크
      if (company.socialLinks) {
        const socialLinks = company.socialLinks as Record<string, string>
        if (socialLinks.facebook) setValue('facebookUrl', socialLinks.facebook)
        if (socialLinks.instagram) setValue('instagramUrl', socialLinks.instagram)
        if (socialLinks.youtube) setValue('youtubeUrl', socialLinks.youtube)
        if (socialLinks.blog) setValue('blogUrl', socialLinks.blog)
      }

      // 이미지
      if (company.images && company.images.length > 0) {
        const logo = company.images.find(img => img.imageType === 'LOGO')
        const cover = company.images.find(img => img.imageType === 'COVER')
        const gallery = company.images.filter(img => img.imageType === 'GALLERY')

        if (logo) setLogoImageUrl(logo.imageUrl)
        if (cover) setCoverImageUrl(cover.imageUrl)
        if (gallery.length > 0) setGalleryImageUrls(gallery.map(img => img.imageUrl))
      }
    }
  }, [companyResponse, setValue])

  // 프로필 정보를 폼에 자동 입력 (회사 정보가 없을 때만)
  useEffect(() => {
    if (profileResponse?.data && !companyResponse?.data) {
      const profile = profileResponse.data

      // 기본 정보 자동 입력
      if (profile.name) setValue('name', profile.name)
      if (profile.email) setValue('email', profile.email)
      if (profile.phone) setValue('primaryPhone', profile.phone)
      if (profile.address) setValue('address', profile.address)
      if (profile.postalCode) setValue('postalCode', profile.postalCode)
      if (profile.bio) setValue('description', profile.bio)
    }
  }, [profileResponse, companyResponse, setValue])

  // 주소 검색
  const handleAddressSearch = () => {
    if (!isScriptLoaded) {
      showErrorToast(null, '주소 검색 스크립트를 로딩 중입니다')
      return
    }

    openAddressSearch((data) => {
      setValue('address', data.address)
      setValue('postalCode', data.zonecode)

      // 좌표 저장
      if (data.latitude !== undefined && data.longitude !== undefined) {
        setLatitude(data.latitude)
        setLongitude(data.longitude)
      }
    })
  }

  const onSubmit = async (data: FormData) => {
    // 중복 제출 방지
    if (isSubmitting) {
      console.log('이미 제출 중입니다')
      return
    }

    setIsSubmitting(true)

    try {
      const fullAddress = data.addressDetail
        ? `${data.address} ${data.addressDetail}`
        : data.address

      // slug 생성 (회사명을 기반으로)
      const slug = data.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

      // 사업자 정보 객체 생성
      const businessInfo: Record<string, string> = {}
      if (data.businessRegistrationNumber) businessInfo.businessRegistrationNumber = data.businessRegistrationNumber
      if (data.representativeName) businessInfo.representativeName = data.representativeName
      if (data.companyType) businessInfo.companyType = data.companyType

      // 영업시간 구조화 객체 생성
      const businessHours: Record<string, string> = {}
      if (data.mondayHours) businessHours.monday = data.mondayHours
      if (data.tuesdayHours) businessHours.tuesday = data.tuesdayHours
      if (data.wednesdayHours) businessHours.wednesday = data.wednesdayHours
      if (data.thursdayHours) businessHours.thursday = data.thursdayHours
      if (data.fridayHours) businessHours.friday = data.fridayHours
      if (data.saturdayHours) businessHours.saturday = data.saturdayHours
      if (data.sundayHours) businessHours.sunday = data.sundayHours

      // SNS 링크 객체 생성
      const socialLinks: Record<string, string> = {}
      if (data.facebookUrl) socialLinks.facebook = data.facebookUrl
      if (data.instagramUrl) socialLinks.instagram = data.instagramUrl
      if (data.youtubeUrl) socialLinks.youtube = data.youtubeUrl
      if (data.blogUrl) socialLinks.blog = data.blogUrl

      const registrationData: CompanyRegistrationData = {
        name: data.name,
        ...(isEditMode ? {} : { slug: slug + '-' + Date.now() }), // 신규 등록일 때만 slug 생성
        description: data.description,
        detailContent: data.detailContent || undefined,
        detailContentFormat: 'text',

        // 사업자 정보
        businessInfo: Object.keys(businessInfo).length > 0 ? businessInfo : undefined,

        // 영업시간
        businessHours: Object.keys(businessHours).length > 0 ? businessHours : undefined,
        businessHoursNote: data.businessHoursNote || undefined,

        primaryPhone: data.primaryPhone,
        secondaryPhone: data.secondaryPhone || undefined,
        emergencyContact: data.emergencyContact || undefined,
        email: data.email,
        websiteUrl: data.websiteUrl || undefined,
        kakaoChatUrl: data.kakaoChatUrl || undefined,

        address: fullAddress,
        postalCode: data.postalCode,

        // 좌표 정보
        latitude: latitude,
        longitude: longitude,

        // 배열 변환 (쉼표로 구분된 문자열을 배열로)
        serviceAreas: data.serviceAreas
          ? data.serviceAreas.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
        tags: data.tags
          ? data.tags.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
        keywords: data.keywords
          ? data.keywords.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
        filterOptionIds: data.filterOptionIds
          ? data.filterOptionIds.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
          : undefined,

        // SNS 링크
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,

        // 이미지 URL 추가
        logoImageUrl: logoImageUrl || undefined,
        coverImageUrl: coverImageUrl || undefined,
        galleryImageUrls: galleryImageUrls.length > 0 ? galleryImageUrls : undefined,
      }

      if (isEditMode) {
        // 수정 모드
        if (!companyUuid) {
          showErrorToast(null, '회사 UUID를 찾을 수 없습니다')
          setIsSubmitting(false)
          return
        }

        console.log('업체 수정 요청:', {
          companyUuid,
          isEditMode,
          dataKeys: Object.keys(registrationData)
        })

        updateCompanyMutation.mutate({ companyUuid, data: registrationData }, {
          onSuccess: () => {
            showSuccessToast('회사 정보가 수정되었습니다!')
            router.push('/mypage')
          },
          onError: (error) => {
            console.error('수정 오류:', error)
            showErrorToast(error, '회사 수정 중 오류가 발생했습니다')
            setIsSubmitting(false)
          },
        })
      } else {
        // 등록 모드
        createCompanyMutation.mutate(registrationData, {
          onSuccess: () => {
            showSuccessToast('회사 정보가 등록되었습니다!')
            router.push('/mypage')
          },
          onError: (error) => {
            showErrorToast(error, '회사 등록 중 오류가 발생했습니다')
            setIsSubmitting(false)
          },
        })
      }
    } catch (error) {
      console.error('Submit error:', error)
      setIsSubmitting(false)
    }
  }

  // 로그인 체크 중 또는 프로필 로딩 중
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? '업체 상세정보 수정' : '회사 정보 등록'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {isEditMode ? '업체 정보를 수정하여 최신 정보를 유지하세요' : '업체 정보를 등록하여 고객에게 알려보세요'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* 기본 정보 */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    회사명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register('name', {
                      required: '회사명을 입력해주세요',
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="예: 병원인테리어 다모아"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    간단한 소개 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="description"
                    type="text"
                    {...register('description', {
                      required: '간단한 소개를 입력해주세요',
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="예: 20년 경력의 병원 인테리어 전문 업체입니다"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="detailContent" className="block text-sm font-medium text-gray-700 mb-1">
                    상세 설명
                  </label>
                  <textarea
                    id="detailContent"
                    {...register('detailContent')}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="회사의 강점, 주요 서비스, 경력 등을 자유롭게 작성해주세요"
                  />
                </div>
              </div>
            </div>

            {/* 사업자 정보 */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">사업자 정보</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="businessRegistrationNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    사업자등록번호
                  </label>
                  <input
                    id="businessRegistrationNumber"
                    type="text"
                    {...register('businessRegistrationNumber')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="000-00-00000"
                  />
                </div>

                <div>
                  <label htmlFor="representativeName" className="block text-sm font-medium text-gray-700 mb-1">
                    대표자명
                  </label>
                  <input
                    id="representativeName"
                    type="text"
                    {...register('representativeName')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="홍길동"
                  />
                </div>

                <div>
                  <label htmlFor="companyType" className="block text-sm font-medium text-gray-700 mb-1">
                    업체 형태
                  </label>
                  <select
                    id="companyType"
                    {...register('companyType')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">선택하세요</option>
                    <option value="individual">개인사업자</option>
                    <option value="corporation">법인사업자</option>
                    <option value="other">기타</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 연락처 정보 */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">연락처 정보</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="primaryPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    대표 전화번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="primaryPhone"
                    type="tel"
                    {...register('primaryPhone', {
                      required: '대표 전화번호를 입력해주세요',
                      pattern: {
                        value: /^[0-9-]+$/,
                        message: '올바른 전화번호 형식이 아닙니다',
                      },
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="02-1234-5678"
                  />
                  {errors.primaryPhone && (
                    <p className="mt-1 text-sm text-red-600">{errors.primaryPhone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="secondaryPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    보조 전화번호
                  </label>
                  <input
                    id="secondaryPhone"
                    type="tel"
                    {...register('secondaryPhone')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="010-1234-5678"
                  />
                </div>

                <div>
                  <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-1">
                    긴급 연락처
                  </label>
                  <input
                    id="emergencyContact"
                    type="tel"
                    {...register('emergencyContact')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="010-9999-9999"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register('email', {
                      required: '이메일을 입력해주세요',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: '올바른 이메일 형식이 아닙니다',
                      },
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="company@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 주소 정보 */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">주소 정보</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    주소 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="address"
                      type="text"
                      {...register('address', {
                        required: '주소를 검색해주세요',
                      })}
                      readOnly
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      placeholder="주소 검색 버튼을 클릭하세요"
                    />
                    <button
                      type="button"
                      onClick={handleAddressSearch}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
                    >
                      주소 검색
                    </button>
                  </div>
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="addressDetail" className="block text-sm font-medium text-gray-700 mb-1">
                    상세 주소
                  </label>
                  <input
                    id="addressDetail"
                    type="text"
                    {...register('addressDetail')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="상세 주소를 입력하세요"
                    disabled={!address}
                  />
                </div>

                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                    우편번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="postalCode"
                    type="text"
                    {...register('postalCode', {
                      required: '우편번호를 입력해주세요',
                    })}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    placeholder="우편번호"
                  />
                  {errors.postalCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 영업 정보 */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">영업 정보</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="businessHoursNote" className="block text-sm font-medium text-gray-700 mb-1">
                    영업시간 안내
                  </label>
                  <textarea
                    id="businessHoursNote"
                    {...register('businessHoursNote')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="예: 평일 09:00 ~ 18:00, 주말 및 공휴일 휴무"
                  />
                </div>

                {/* 요일별 영업시간 */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">요일별 영업시간 (선택사항)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="mondayHours" className="block text-xs text-gray-600 mb-1">월요일</label>
                      <input
                        id="mondayHours"
                        type="text"
                        {...register('mondayHours')}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="09:00-18:00 또는 휴무"
                      />
                    </div>
                    <div>
                      <label htmlFor="tuesdayHours" className="block text-xs text-gray-600 mb-1">화요일</label>
                      <input
                        id="tuesdayHours"
                        type="text"
                        {...register('tuesdayHours')}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="09:00-18:00 또는 휴무"
                      />
                    </div>
                    <div>
                      <label htmlFor="wednesdayHours" className="block text-xs text-gray-600 mb-1">수요일</label>
                      <input
                        id="wednesdayHours"
                        type="text"
                        {...register('wednesdayHours')}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="09:00-18:00 또는 휴무"
                      />
                    </div>
                    <div>
                      <label htmlFor="thursdayHours" className="block text-xs text-gray-600 mb-1">목요일</label>
                      <input
                        id="thursdayHours"
                        type="text"
                        {...register('thursdayHours')}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="09:00-18:00 또는 휴무"
                      />
                    </div>
                    <div>
                      <label htmlFor="fridayHours" className="block text-xs text-gray-600 mb-1">금요일</label>
                      <input
                        id="fridayHours"
                        type="text"
                        {...register('fridayHours')}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="09:00-18:00 또는 휴무"
                      />
                    </div>
                    <div>
                      <label htmlFor="saturdayHours" className="block text-xs text-gray-600 mb-1">토요일</label>
                      <input
                        id="saturdayHours"
                        type="text"
                        {...register('saturdayHours')}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="09:00-18:00 또는 휴무"
                      />
                    </div>
                    <div>
                      <label htmlFor="sundayHours" className="block text-xs text-gray-600 mb-1">일요일</label>
                      <input
                        id="sundayHours"
                        type="text"
                        {...register('sundayHours')}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="09:00-18:00 또는 휴무"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="serviceAreas" className="block text-sm font-medium text-gray-700 mb-1">
                    서비스 지역
                  </label>
                  <input
                    id="serviceAreas"
                    type="text"
                    {...register('serviceAreas')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="쉼표로 구분하여 입력 (예: 서울, 경기, 인천)"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    지역을 쉼표(,)로 구분하여 입력해주세요
                  </p>
                </div>
              </div>
            </div>

            {/* 추가 정보 */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">추가 정보</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    웹사이트 URL
                  </label>
                  <input
                    id="websiteUrl"
                    type="url"
                    {...register('websiteUrl')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://www.example.com"
                  />
                </div>

                <div>
                  <label htmlFor="kakaoChatUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    카카오톡 채널 URL
                  </label>
                  <input
                    id="kakaoChatUrl"
                    type="url"
                    {...register('kakaoChatUrl')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://pf.kakao.com/..."
                  />
                </div>
              </div>
            </div>

            {/* SNS 링크 */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">SNS 링크</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="facebookUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    페이스북
                  </label>
                  <input
                    id="facebookUrl"
                    type="url"
                    {...register('facebookUrl')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div>
                  <label htmlFor="instagramUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    인스타그램
                  </label>
                  <input
                    id="instagramUrl"
                    type="url"
                    {...register('instagramUrl')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://instagram.com/..."
                  />
                </div>

                <div>
                  <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    유튜브
                  </label>
                  <input
                    id="youtubeUrl"
                    type="url"
                    {...register('youtubeUrl')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div>
                  <label htmlFor="blogUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    블로그
                  </label>
                  <input
                    id="blogUrl"
                    type="url"
                    {...register('blogUrl')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://blog.naver.com/..."
                  />
                </div>
              </div>
            </div>

            {/* 태그 및 키워드 */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">태그 및 키워드</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                    태그
                  </label>
                  <input
                    id="tags"
                    type="text"
                    {...register('tags')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="쉼표로 구분하여 입력 (예: 병원인테리어, 의료시설, 리모델링)"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    태그를 쉼표(,)로 구분하여 입력해주세요
                  </p>
                </div>

                <div>
                  <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
                    검색 키워드
                  </label>
                  <input
                    id="keywords"
                    type="text"
                    {...register('keywords')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="쉼표로 구분하여 입력 (예: 인테리어, 병원, 개원)"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    검색에 사용될 키워드를 쉼표(,)로 구분하여 입력해주세요
                  </p>
                </div>

                <div>
                  <label htmlFor="filterOptionIds" className="block text-sm font-medium text-gray-700 mb-1">
                    필터 옵션 ID
                  </label>
                  <input
                    id="filterOptionIds"
                    type="text"
                    {...register('filterOptionIds')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="쉼표로 구분하여 입력 (예: 1, 2, 3)"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    필터 옵션 ID를 쉼표(,)로 구분하여 입력해주세요
                  </p>
                </div>
              </div>
            </div>

            {/* 이미지 업로드 */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">이미지</h2>

              <div className="space-y-6">
                {/* 로고 이미지 */}
                <ImageUpload
                  label="로고 이미지"
                  value={logoImageUrl}
                  onChange={(url) => setLogoImageUrl(url as string)}
                  multiple={false}
                />

                {/* 커버 이미지 */}
                <ImageUpload
                  label="커버 이미지"
                  value={coverImageUrl}
                  onChange={(url) => setCoverImageUrl(url as string)}
                  multiple={false}
                />

                {/* 갤러리 이미지 */}
                <ImageUpload
                  label="갤러리 이미지 (최대 10개)"
                  value={galleryImageUrls}
                  onChange={(urls) => setGalleryImageUrls(urls as string[])}
                  multiple={true}
                  maxFiles={10}
                />
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting || createCompanyMutation.isPending || updateCompanyMutation.isPending}
                className="flex-1 py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || createCompanyMutation.isPending || updateCompanyMutation.isPending
                  ? isEditMode ? '수정 중...' : '등록 중...'
                  : isEditMode ? '업체 정보 수정' : '회사 정보 등록'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
