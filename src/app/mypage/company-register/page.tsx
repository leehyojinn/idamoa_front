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
import { useAuthStore } from '@/stores/authStore'
import { getProfileStatus } from '@/lib/api/profile'
import ImageUpload, { type ImageData } from '@/components/ui/ImageUpload'
import Select from '@/components/ui/Select'
import { formatPhoneNumber, formatBusinessNumber, formatUrl } from '@/lib/utils'
import { getPublicFilters, type PublicFilterCategory } from '@/lib/api/filter'
import { FiChevronDown, FiChevronRight, FiFilter, FiX, FiCheck } from 'react-icons/fi'

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

  // SNS 링크
  facebookUrl: string
  instagramUrl: string
  youtubeUrl: string
  blogUrl: string
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

  // 인증 상태 가져오기
  const { accessToken, _hasHydrated, updateUserRole } = useAuthStore()

  // 이미지 데이터 상태 관리 (UUID + URL)
  const [logoImage, setLogoImage] = useState<ImageData | undefined>(undefined)
  const [coverImage, setCoverImage] = useState<ImageData | undefined>(undefined)
  const [galleryImages, setGalleryImages] = useState<ImageData[]>([])

  // 필터 관련 상태 관리
  const [filterCategories, setFilterCategories] = useState<PublicFilterCategory[]>([])
  const [selectedFilterOptionIds, setSelectedFilterOptionIds] = useState<number[]>([])
  const [isLoadingFilters, setIsLoadingFilters] = useState(true)
  const [expandedOptions, setExpandedOptions] = useState<Set<number>>(new Set())
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  // 태그/키워드 상태 관리
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

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
  const primaryPhoneValue = watch('primaryPhone')
  const secondaryPhoneValue = watch('secondaryPhone')
  const emergencyContactValue = watch('emergencyContact')
  const businessNumberValue = watch('businessRegistrationNumber')
  const companyTypeValue = watch('companyType')

  // 삭제/비활성 옵션 필터링
  const filterActiveOptions = (options: PublicFilterCategory['options']) => {
    return options.filter(option => {
      if ((option as any).isDeleted === true) return false
      if ((option as any).isActive === false) return false
      return true
    })
  }

  // 플랫 배열을 트리 구조로 변환
  const buildOptionTree = (options: PublicFilterCategory['options']) => {
    const activeOptions = filterActiveOptions(options)
    const optionMap = new Map<number, any>()
    const roots: any[] = []

    activeOptions.forEach(option => {
      optionMap.set(option.id, { ...option, children: [] })
    })

    activeOptions.forEach(option => {
      const mappedOption = optionMap.get(option.id)
      const parentId = (option as any).parentId
      if (parentId && optionMap.has(parentId)) {
        optionMap.get(parentId).children.push(mappedOption)
      } else {
        roots.push(mappedOption)
      }
    })

    return roots
  }

  // 필터 데이터 로드
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const filters = await getPublicFilters('COMPANY')
        // 각 카테고리의 options를 트리 구조로 변환
        const transformedFilters = filters.map(category => ({
          ...category,
          options: buildOptionTree(category.options)
        }))
        setFilterCategories(transformedFilters)
      } catch (error) {
        showErrorToast(error, '필터 정보를 불러오는데 실패했습니다')
      } finally {
        setIsLoadingFilters(false)
      }
    }
    loadFilters()
  }, [])

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

  // 회사 정보를 폼에 자동 입력 (수정 모드)
  useEffect(() => {
    if (companyResponse?.data) {
      const company = companyResponse.data

      // 기본 정보
      if (company.name) setValue('name', company.name)
      if (company.description) setValue('description', company.description)
      if (company.detailContent) setValue('detailContent', company.detailContent)

      // 연락처
      if (company.primaryPhone) setValue('primaryPhone', formatPhoneNumber(company.primaryPhone))
      if (company.secondaryPhone) setValue('secondaryPhone', formatPhoneNumber(company.secondaryPhone))
      if (company.emergencyContact) setValue('emergencyContact', formatPhoneNumber(company.emergencyContact))
      if (company.email) setValue('email', company.email)
      if (company.websiteUrl) setValue('websiteUrl', company.websiteUrl)
      if (company.kakaoChatUrl) setValue('kakaoChatUrl', company.kakaoChatUrl)

      // 주소
      if (company.address) setValue('address', company.address)
      if (company.postalCode) setValue('postalCode', company.postalCode)

      // 사업자 정보
      if (company.businessInfo) {
        const businessInfo = company.businessInfo as Record<string, string>
        if (businessInfo.businessRegistrationNumber) setValue('businessRegistrationNumber', formatBusinessNumber(businessInfo.businessRegistrationNumber))
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

      // 필터 옵션 복원
      if (company.filterGroups && company.filterGroups.length > 0) {
        const optionIds = company.filterGroups.flatMap(group =>
          group.options.map(option => option.id)
        )
        setSelectedFilterOptionIds(optionIds)
      }

      // 태그 복원
      if (company.tags) setTags(company.tags)

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

        if (logo) {
          setLogoImage({ uuid: logo.fileUuid, url: logo.imageUrl })
        }
        if (cover) {
          setCoverImage({ uuid: cover.fileUuid, url: cover.imageUrl })
        }
        if (gallery.length > 0) {
          setGalleryImages(gallery.map(img => ({ uuid: img.fileUuid, url: img.imageUrl })))
        }
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
      if (profile.phone) setValue('primaryPhone', formatPhoneNumber(profile.phone))
      if (profile.address) setValue('address', profile.address)
      if (profile.postalCode) setValue('postalCode', profile.postalCode)
      if (profile.bio) setValue('description', profile.bio)
    }
  }, [profileResponse, companyResponse, setValue])

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
    })
  }

  const onSubmit = async (data: FormData) => {
    // 중복 제출 방지
    if (isSubmitting) {
      return
    }

    // 필수 전화번호 유효성 검사
    if (!primaryPhoneValue || primaryPhoneValue.trim() === '') {
      showErrorToast(null, '대표 전화번호를 입력해주세요')
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

        primaryPhone: primaryPhoneValue,
        secondaryPhone: secondaryPhoneValue || undefined,
        emergencyContact: emergencyContactValue || undefined,
        email: data.email,
        websiteUrl: data.websiteUrl || undefined,
        kakaoChatUrl: data.kakaoChatUrl || undefined,

        address: fullAddress,
        postalCode: data.postalCode,

        // 필터 옵션 ID
        filterOptionIds: selectedFilterOptionIds.length > 0 ? selectedFilterOptionIds : undefined,

        // 태그
        tags: tags.length > 0 ? tags : undefined,

        // SNS 링크
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,

        // 이미지 UUID 추가
        logoImageUuid: logoImage?.uuid,
        coverImageUuid: coverImage?.uuid,
        galleryImageUuids: galleryImages.length > 0 ? galleryImages.map(img => img.uuid) : undefined,
      }

      if (isEditMode) {
        // 수정 모드
        if (!companyUuid) {
          showErrorToast(null, '회사 UUID를 찾을 수 없습니다')
          setIsSubmitting(false)
          return
        }

        updateCompanyMutation.mutate({ companyUuid, data: registrationData }, {
          onSuccess: () => {
            showSuccessToast('회사 정보가 수정되었습니다!')
            router.push('/mypage')
          },
          onError: (error) => {
            showErrorToast(error, '회사 수정 중 오류가 발생했습니다')
            setIsSubmitting(false)
          },
        })
      } else {
        // 등록 모드
        createCompanyMutation.mutate(registrationData, {
          onSuccess: async () => {
            // 프로필 상태를 다시 가져와서 역할 업데이트
            try {
              const statusResponse = await getProfileStatus()
              if (statusResponse.success && statusResponse.data) {
                updateUserRole(statusResponse.data.currentRole)
              }
            } catch (error) {
              console.error('프로필 상태 업데이트 실패:', error)
            }
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
                    placeholder="예: 인테리어 다모아"
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
                    placeholder="예: 20년 경력의 인테리어 전문 업체입니다"
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
                  <Select
                    label="업체 형태"
                    options={[
                      { value: 'individual', label: '개인사업자' },
                      { value: 'corporation', label: '법인사업자' },
                      { value: 'other', label: '기타' },
                    ]}
                    value={companyTypeValue}
                    onChange={(value) => setValue('companyType', value)}
                    placeholder="선택하세요"
                  />
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

            {/* 필터 옵션 */}
            {filterCategories.length > 0 && (
              <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">서비스 정보</h2>
                <p className="text-sm text-gray-600 mb-6">
                  업체의 서비스 지역, 전문 영역 등을 선택해주세요.
                  {filterCategories.some(cat => cat.isRequired) && (
                    <span className="text-red-500 ml-1">
                      * 표시는 필수 항목입니다.
                    </span>
                  )}
                </p>

                {/* 필터 선택 버튼 */}
                <button
                  type="button"
                  onClick={() => setShowFilterPanel(true)}
                  disabled={isLoadingFilters}
                  className="w-full flex items-center justify-between p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <FiFilter className="text-primary text-xl" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">
                        {isLoadingFilters
                          ? '필터 로딩 중...'
                          : selectedFilterOptionIds.length > 0
                            ? `${selectedFilterOptionIds.length}개의 필터 선택됨`
                            : '필터 선택하기'
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        {filterCategories.length}개 카테고리에서 선택
                      </p>
                    </div>
                  </div>
                  <FiChevronRight className="text-gray-400 text-xl group-hover:text-primary transition-colors" />
                </button>

                {/* 선택된 필터 표시 */}
                {selectedFilterOptionIds.length > 0 && (
                  <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-700">
                        선택된 필터 ({selectedFilterOptionIds.length})
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedFilterOptionIds([])}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        전체 해제
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedFilterOptionIds.map(optionId => {
                        // 필터 옵션 이름 찾기
                        let optionName = ''
                        for (const category of filterCategories) {
                          const findOption = (options: any[]): string => {
                            for (const opt of options) {
                              if (opt.id === optionId) return opt.name
                              if (opt.children?.length > 0) {
                                const found = findOption(opt.children)
                                if (found) return found
                              }
                            }
                            return ''
                          }
                          optionName = findOption(category.options)
                          if (optionName) break
                        }
                        return (
                          <span
                            key={optionId}
                            className="inline-flex items-center gap-1 bg-white text-primary px-3 py-1.5 rounded-full text-sm font-medium shadow-sm border border-primary-200"
                          >
                            {optionName}
                            <button
                              type="button"
                              onClick={() => setSelectedFilterOptionIds(selectedFilterOptionIds.filter(id => id !== optionId))}
                              className="ml-1 hover:text-red-600 transition-colors"
                            >
                              <FiX className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 태그/키워드 */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">태그 및 키워드</h2>
              <p className="text-sm text-gray-600 mb-4">
                검색에 도움이 되는 태그나 키워드를 추가해주세요.
              </p>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                  태그 추가
                </label>
                <div className="flex gap-2">
                  <input
                    id="tags"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const value = tagInput.trim()
                        if (value && !tags.includes(value)) {
                          setTags([...tags, value])
                          setTagInput('')
                        }
                      }
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="태그를 입력하고 엔터를 누르세요"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const value = tagInput.trim()
                      if (value && !tags.includes(value)) {
                        setTags([...tags, value])
                        setTagInput('')
                      }
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
                  >
                    추가
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags.map((tag, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => setTags(tags.filter((_, i) => i !== index))}
                          className="hover:text-purple-900"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  예: 인테리어, 리모델링, 고급마감 등
                </p>
              </div>
            </div>

            {/* 이미지 업로드 */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">이미지</h2>

              <div className="space-y-6">
                {/* 로고 이미지 */}
                <ImageUpload
                  label="로고 이미지"
                  value={logoImage}
                  onChange={(data) => setLogoImage(data as ImageData | undefined)}
                  multiple={false}
                />

                {/* 커버 이미지 */}
                <ImageUpload
                  label="커버 이미지"
                  value={coverImage}
                  onChange={(data) => setCoverImage(data as ImageData | undefined)}
                  multiple={false}
                />

                {/* 갤러리 이미지 */}
                <ImageUpload
                  label="갤러리 이미지 (최대 10개)"
                  value={galleryImages}
                  onChange={(data) => setGalleryImages(data as ImageData[])}
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

      {/* 필터 사이드 패널 */}
      {showFilterPanel && (
        <div className="fixed inset-0 z-50">
          {/* 배경 오버레이 */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowFilterPanel(false)}
          />

          {/* 사이드 패널 */}
          <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary to-primary/80 text-white">
              <div>
                <h3 className="text-lg font-bold">필터 선택</h3>
                <p className="text-sm text-white/80">
                  {selectedFilterOptionIds.length}개 선택됨
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFilterPanel(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* 선택된 필터 미리보기 */}
            {selectedFilterOptionIds.length > 0 && (
              <div className="p-4 bg-primary-50 border-b">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">선택된 필터</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFilterOptionIds([])}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    전체 해제
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFilterOptionIds.slice(0, 10).map(optionId => {
                    // 필터 옵션 이름 찾기
                    let optionName = ''
                    for (const category of filterCategories) {
                      const findOption = (options: any[]): string => {
                        for (const opt of options) {
                          if (opt.id === optionId) return opt.name
                          if (opt.children?.length > 0) {
                            const found = findOption(opt.children)
                            if (found) return found
                          }
                        }
                        return ''
                      }
                      optionName = findOption(category.options)
                      if (optionName) break
                    }
                    return (
                      <span
                        key={optionId}
                        className="inline-flex items-center gap-1 bg-white text-primary px-2 py-1 rounded-full text-xs font-medium shadow-sm border border-primary-200"
                      >
                        {optionName}
                        <button
                          type="button"
                          onClick={() => setSelectedFilterOptionIds(selectedFilterOptionIds.filter(id => id !== optionId))}
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </span>
                    )
                  })}
                  {selectedFilterOptionIds.length > 10 && (
                    <span className="text-xs text-gray-500 py-1">
                      +{selectedFilterOptionIds.length - 10}개 더
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 필터 목록 */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingFilters ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary"></div>
                    <p className="mt-2 text-gray-600">필터 로딩 중...</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filterCategories.map((category) => {
                    // 선택된 개수 계산 (재귀적으로 모든 리프 노드 확인)
                    const countSelected = (options: any[]): number => {
                      return options.reduce((sum, opt) => {
                        if (selectedFilterOptionIds.includes(opt.id)) sum += 1
                        if (opt.children && opt.children.length > 0) {
                          sum += countSelected(opt.children)
                        }
                        return sum
                      }, 0)
                    }
                    const selectedCount = countSelected(category.options)

                    // 필터 옵션 렌더링 함수 (재귀적으로 자식 처리)
                    const renderFilterOption = (option: any, depth: number = 0): React.ReactNode => {
                      const hasChildren = option.children && option.children.length > 0
                      const isExpanded = expandedOptions.has(option.id)

                      // 선택된 자식 개수 계산
                      const getSelectedChildrenCount = (opt: any): number => {
                        if (!opt.children || opt.children.length === 0) {
                          return selectedFilterOptionIds.includes(opt.id) ? 1 : 0
                        }
                        return opt.children.reduce((sum: number, child: any) => sum + getSelectedChildrenCount(child), 0)
                      }

                      if (hasChildren) {
                        const childSelectedCount = getSelectedChildrenCount(option)
                        return (
                          <div key={option.id} className={depth > 0 ? 'ml-3' : ''}>
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedOptions(prev => {
                                  const newSet = new Set(prev)
                                  if (newSet.has(option.id)) {
                                    newSet.delete(option.id)
                                  } else {
                                    newSet.add(option.id)
                                  }
                                  return newSet
                                })
                              }}
                              className="w-full flex items-center justify-between py-2 px-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                {isExpanded ? (
                                  <FiChevronDown className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <FiChevronRight className="w-4 h-4 text-gray-400" />
                                )}
                                {option.name}
                              </span>
                              {childSelectedCount > 0 && (
                                <span className="bg-primary-100 text-primary text-xs px-2 py-0.5 rounded-full">
                                  {childSelectedCount}
                                </span>
                              )}
                            </button>
                            {isExpanded && (
                              <div className="ml-2 mt-1 space-y-1 border-l-2 border-gray-100 pl-2">
                                {option.children.map((child: any) => renderFilterOption(child, depth + 1))}
                              </div>
                            )}
                          </div>
                        )
                      }

                      // 자식이 없으면 선택 가능한 버튼
                      const isSelected = selectedFilterOptionIds.includes(option.id)
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedFilterOptionIds(selectedFilterOptionIds.filter(id => id !== option.id))
                            } else {
                              setSelectedFilterOptionIds([...selectedFilterOptionIds, option.id])
                            }
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-primary text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'bg-white border-white'
                              : 'border-gray-400'
                          }`}>
                            {isSelected && <FiCheck className="w-3 h-3 text-primary" />}
                          </span>
                          <span className="truncate">{option.name}</span>
                        </button>
                      )
                    }

                    return (
                      <div key={category.id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">
                              {category.name}
                            </h4>
                            {category.isRequired && (
                              <span className="text-red-500 text-sm">*</span>
                            )}
                            {selectedCount > 0 && (
                              <span className="bg-primary-100 text-primary text-xs px-2 py-0.5 rounded-full">
                                {selectedCount}
                              </span>
                            )}
                          </div>
                        </div>
                        {category.description && (
                          <p className="text-xs text-gray-500 mb-3">{category.description}</p>
                        )}
                        <div className="space-y-1">
                          {category.options.map((option) => renderFilterOption(option, 0))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="p-4 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => setShowFilterPanel(false)}
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                {selectedFilterOptionIds.length > 0
                  ? `${selectedFilterOptionIds.length}개 필터 적용하기`
                  : '닫기'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
