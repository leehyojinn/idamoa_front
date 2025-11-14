'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useKakaoAddress } from '@/hooks/useKakaoAddress'
import { useCompanyByUuid, useUpdateCompany } from '@/hooks/useCompany'
import type { CompanyRegistrationData } from '@/lib/api/company'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import ImageUpload from '@/components/ui/ImageUpload'
import { formatPhoneNumber, formatBusinessNumber, formatUrl } from '@/lib/utils'

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

export default function CompanyEditPage() {
  const router = useRouter()
  const params = useParams()
  const companyUuid = params.uuid as string

  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const { isScriptLoaded, openAddressSearch } = useKakaoAddress()

  // 이미지 URL 상태 관리
  const [logoImageUrl, setLogoImageUrl] = useState<string>('')
  const [coverImageUrl, setCoverImageUrl] = useState<string>('')
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([])

  // 좌표 상태 관리
  const [latitude, setLatitude] = useState<number | undefined>(undefined)
  const [longitude, setLongitude] = useState<number | undefined>(undefined)

  // React Query
  const { data: companyResponse, isLoading: isLoadingCompany } = useCompanyByUuid(companyUuid)
  const updateCompanyMutation = useUpdateCompany(companyUuid)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>()

  const address = watch('address')
  const primaryPhoneValue = watch('primaryPhone')
  const secondaryPhoneValue = watch('secondaryPhone')
  const emergencyContactValue = watch('emergencyContact')
  const businessNumberValue = watch('businessRegistrationNumber')

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

  // 기존 데이터 로드 및 폼 채우기
  useEffect(() => {
    if (companyResponse?.success && companyResponse.data) {
      const company = companyResponse.data

      // 기본 정보
      setValue('name', company.name)
      setValue('description', company.description)
      setValue('detailContent', company.detailContent || '')

      // 사업자 정보
      if (company.businessInfo) {
        const info = company.businessInfo as Record<string, string>
        setValue('businessRegistrationNumber', formatBusinessNumber(info.businessRegistrationNumber || ''))
        setValue('representativeName', info.representativeName || '')
        setValue('companyType', info.companyType || '')
      }

      // 연락처
      setValue('primaryPhone', formatPhoneNumber(company.primaryPhone))
      setValue('secondaryPhone', company.secondaryPhone ? formatPhoneNumber(company.secondaryPhone) : '')
      setValue('emergencyContact', company.emergencyContact ? formatPhoneNumber(company.emergencyContact) : '')
      setValue('email', company.email)
      setValue('websiteUrl', company.websiteUrl || '')
      setValue('kakaoChatUrl', company.kakaoChatUrl || '')

      // 주소 (상세 주소 분리)
      const addressParts = company.address.split(' ')
      const mainAddress = addressParts.slice(0, -1).join(' ')
      const detailAddress = addressParts[addressParts.length - 1]
      setValue('address', mainAddress || company.address)
      setValue('addressDetail', detailAddress || '')
      setValue('postalCode', company.postalCode)

      // 좌표
      if (company.latitude !== undefined) setLatitude(company.latitude)
      if (company.longitude !== undefined) setLongitude(company.longitude)

      // 영업 정보
      setValue('businessHoursNote', company.businessHoursNote || '')

      // 영업시간 구조화
      if (company.businessHours) {
        const hours = company.businessHours as Record<string, string>
        setValue('mondayHours', hours.monday || '')
        setValue('tuesdayHours', hours.tuesday || '')
        setValue('wednesdayHours', hours.wednesday || '')
        setValue('thursdayHours', hours.thursday || '')
        setValue('fridayHours', hours.friday || '')
        setValue('saturdayHours', hours.saturday || '')
        setValue('sundayHours', hours.sunday || '')
      }

      setValue('serviceAreas', company.serviceAreas?.join(', ') || '')
      setValue('tags', company.tags?.join(', ') || '')
      setValue('keywords', company.keywords?.join(', ') || '')

      // 필터 옵션
      if (company.filterOptions && company.filterOptions.length > 0) {
        const filterIds = company.filterOptions.map(opt => opt.id).join(', ')
        setValue('filterOptionIds', filterIds)
      }

      // SNS 링크
      if (company.socialLinks) {
        const links = company.socialLinks as Record<string, string>
        setValue('facebookUrl', links.facebook || '')
        setValue('instagramUrl', links.instagram || '')
        setValue('youtubeUrl', links.youtube || '')
        setValue('blogUrl', links.blog || '')
      }

      // 이미지
      const logoImage = company.images?.find((img) => img.imageType === 'LOGO')
      const coverImage = company.images?.find((img) => img.imageType === 'COVER')
      const galleryImages = company.images?.filter((img) => img.imageType === 'GALLERY')

      if (logoImage) setLogoImageUrl(logoImage.imageUrl)
      if (coverImage) setCoverImageUrl(coverImage.imageUrl)
      if (galleryImages && galleryImages.length > 0) {
        setGalleryImageUrls(galleryImages.map((img) => img.imageUrl))
      }
    }
  }, [companyResponse, setValue])

  // 전화번호 핸들러 함수
  const handlePrimaryPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setValue('primaryPhone', formatted)
  }

  const handleSecondaryPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setValue('secondaryPhone', formatted)
  }

  const handleEmergencyContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setValue('emergencyContact', formatted)
  }

  // 사업자 등록번호 핸들러
  const handleBusinessNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBusinessNumber(e.target.value)
    setValue('businessRegistrationNumber', formatted)
  }

  // URL 포맷 핸들러
  const handleUrlBlur = (fieldName: keyof FormData) => (e: React.FocusEvent<HTMLInputElement>) => {
    const formatted = formatUrl(e.target.value)
    setValue(fieldName, formatted)
  }

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
    // 필수 전화번호 유효성 검사
    if (!primaryPhoneValue || primaryPhoneValue.trim() === '') {
      showErrorToast(null, '대표 전화번호를 입력해주세요')
      return
    }

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

    const updateData: Partial<CompanyRegistrationData> = {
      name: data.name,
      slug: slug + '-' + Date.now(), // 고유성 보장
      description: data.description,
      detailContent: data.detailContent || undefined,
      detailContentFormat: 'text',

      // 사업자 정보
      businessInfo: Object.keys(businessInfo).length > 0 ? businessInfo : undefined,

      // 영업시간
      businessHours: Object.keys(businessHours).length > 0 ? businessHours : undefined,
      businessHoursNote: data.businessHoursNote || undefined,

      primaryPhone: primaryPhoneValue,
      secondaryPhone: secondaryPhoneValue || undefined,
      emergencyContact: emergencyContactValue || undefined,
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

    updateCompanyMutation.mutate(updateData, {
      onSuccess: () => {
        showSuccessToast('회사 정보가 수정되었습니다!')
        router.push('/mypage')
      },
      onError: (error) => {
        showErrorToast(error, '회사 정보 수정 중 오류가 발생했습니다')
      },
    })
  }

  // 로딩 중
  if (isCheckingAuth || isLoadingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!companyResponse?.data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">업체 정보를 찾을 수 없습니다</h2>
            <button
              onClick={() => router.push('/mypage')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              내 페이지로 돌아가기
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar showQuickmenu={false} />

      <main className="flex-1 bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">회사 정보 수정</h1>
            <p className="mt-2 text-sm text-gray-600">
              업체 정보를 수정하세요
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
                    value={businessNumberValue || ''}
                    onChange={handleBusinessNumberChange}
                    maxLength={12}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="000-00-00000"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    숫자를 입력하면 자동으로 하이픈이 추가됩니다
                  </p>
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
                    value={primaryPhoneValue || ''}
                    onChange={handlePrimaryPhoneChange}
                    maxLength={13}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="02-1234-5678"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    숫자를 입력하면 자동으로 하이픈이 추가됩니다
                  </p>
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
                    value={secondaryPhoneValue || ''}
                    onChange={handleSecondaryPhoneChange}
                    maxLength={13}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="010-1234-5678"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    숫자를 입력하면 자동으로 하이픈이 추가됩니다
                  </p>
                </div>

                <div>
                  <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-1">
                    긴급 연락처
                  </label>
                  <input
                    id="emergencyContact"
                    type="tel"
                    value={emergencyContactValue || ''}
                    onChange={handleEmergencyContactChange}
                    maxLength={13}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="010-9999-9999"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    숫자를 입력하면 자동으로 하이픈이 추가됩니다
                  </p>
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
                    onBlur={handleUrlBlur('websiteUrl')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://www.example.com"
                  />
                </div>
              </div>
            </div>
            {/* SNS 링크 */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">SNS 링크</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="kakaoChatUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    카카오톡 채널 URL
                  </label>
                  <input
                    id="kakaoChatUrl"
                    type="url"
                    {...register('kakaoChatUrl')}
                    onBlur={handleUrlBlur('kakaoChatUrl')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://pf.kakao.com/..."
                  />
                </div>
                <div>
                  <label htmlFor="facebookUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    페이스북
                  </label>
                  <input
                    id="facebookUrl"
                    type="url"
                    {...register('facebookUrl')}
                    onBlur={handleUrlBlur('facebookUrl')}
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
                    onBlur={handleUrlBlur('instagramUrl')}
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
                    onBlur={handleUrlBlur('youtubeUrl')}
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
                    onBlur={handleUrlBlur('blogUrl')}
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
                onClick={() => router.push('/mypage')}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={updateCompanyMutation.isPending}
                className="flex-1 py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateCompanyMutation.isPending ? '수정 중...' : '회사 정보 수정'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
