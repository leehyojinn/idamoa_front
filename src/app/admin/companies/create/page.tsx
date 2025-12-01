'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'
import ImageUpload, { type ImageData } from '@/components/ui/ImageUpload'
import Checkbox from '@/components/ui/Checkbox'
import Select from '@/components/ui/Select'
import { useKakaoAddress } from '@/hooks/useKakaoAddress'
import { createAdminCompany, type CompanyRegistrationData } from '@/lib/api/company'
import { getPublicFilters, type PublicFilterCategory } from '@/lib/api/filter'
import { formatPhoneNumber, formatBusinessNumber, formatUrl } from '@/lib/utils'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'

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

  // SNS 링크
  facebookUrl: string
  instagramUrl: string
  youtubeUrl: string
  blogUrl: string

  // 관리자 전용 필드
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  featured: boolean
  verified: boolean
}

export default function AdminCompanyCreatePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isScriptLoaded, openAddressSearch } = useKakaoAddress()

  // 이미지 데이터 상태 관리
  const [logoImage, setLogoImage] = useState<ImageData | undefined>(undefined)
  const [coverImage, setCoverImage] = useState<ImageData | undefined>(undefined)
  const [galleryImages, setGalleryImages] = useState<ImageData[]>([])

  // 필터 관련 상태
  const [filterCategories, setFilterCategories] = useState<PublicFilterCategory[]>([])
  const [selectedFilterOptionIds, setSelectedFilterOptionIds] = useState<number[]>([])
  const [isLoadingFilters, setIsLoadingFilters] = useState(true)

  // 태그 상태
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      status: 'ACTIVE',
      featured: false,
      verified: false,
    },
  })

  const address = watch('address')
  const primaryPhoneValue = watch('primaryPhone')
  const secondaryPhoneValue = watch('secondaryPhone')
  const emergencyContactValue = watch('emergencyContact')
  const businessNumberValue = watch('businessRegistrationNumber')
  const companyTypeValue = watch('companyType')
  const statusValue = watch('status')
  const featuredValue = watch('featured')
  const verifiedValue = watch('verified')

  // 필터 데이터 로드
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const filters = await getPublicFilters('COMPANY')
        setFilterCategories(filters)
      } catch (error) {
        showErrorToast(error, '필터 정보를 불러오는데 실패했습니다')
      } finally {
        setIsLoadingFilters(false)
      }
    }
    loadFilters()
  }, [])

  // 전화번호 핸들러
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
    if (isSubmitting) return

    if (!primaryPhoneValue || primaryPhoneValue.trim() === '') {
      showErrorToast(null, '대표 전화번호를 입력해주세요')
      return
    }

    setIsSubmitting(true)

    try {
      const fullAddress = data.addressDetail
        ? `${data.address} ${data.addressDetail}`
        : data.address

      // slug 생성
      const slug = data.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') + '-' + Date.now()

      // 사업자 정보 객체
      const businessInfo: Record<string, string> = {}
      if (data.businessRegistrationNumber) businessInfo.businessRegistrationNumber = data.businessRegistrationNumber
      if (data.representativeName) businessInfo.representativeName = data.representativeName
      if (data.companyType) businessInfo.companyType = data.companyType

      // SNS 링크 객체
      const socialLinks: Record<string, string> = {}
      if (data.facebookUrl) socialLinks.facebook = data.facebookUrl
      if (data.instagramUrl) socialLinks.instagram = data.instagramUrl
      if (data.youtubeUrl) socialLinks.youtube = data.youtubeUrl
      if (data.blogUrl) socialLinks.blog = data.blogUrl

      const registrationData: CompanyRegistrationData = {
        name: data.name,
        slug,
        description: data.description,
        detailContent: data.detailContent || undefined,
        detailContentFormat: 'text',

        businessInfo: Object.keys(businessInfo).length > 0 ? businessInfo : undefined,
        businessHoursNote: data.businessHoursNote || undefined,

        primaryPhone: primaryPhoneValue,
        secondaryPhone: secondaryPhoneValue || undefined,
        emergencyContact: emergencyContactValue || undefined,
        email: data.email,
        websiteUrl: data.websiteUrl || undefined,
        kakaoChatUrl: data.kakaoChatUrl || undefined,

        address: fullAddress,
        postalCode: data.postalCode,

        filterOptionIds: selectedFilterOptionIds.length > 0 ? selectedFilterOptionIds : undefined,
        tags: tags.length > 0 ? tags : undefined,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,

        logoImageUuid: logoImage?.uuid,
        coverImageUuid: coverImage?.uuid,
        galleryImageUuids: galleryImages.length > 0 ? galleryImages.map(img => img.uuid) : undefined,
      }

      // 관리자 API 사용 (ownerId 없이)
      await createAdminCompany({ data: registrationData })
      showSuccessToast('업체가 등록되었습니다!')
      router.push('/admin/companies')
    } catch (error) {
      showErrorToast(error, '업체 등록 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminGuard>
      <Navbar showQuickmenu={false} />
      <main className="flex-1 bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">업체 등록</h1>
            <p className="mt-2 text-sm text-gray-600">새로운 업체를 등록합니다</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* 관리자 전용 설정 */}
            <div className="bg-yellow-50 shadow-md rounded-lg p-6 border border-yellow-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">관리자 전용 설정</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Select
                    label="업체 상태"
                    options={[
                      { value: 'ACTIVE', label: '활성' },
                      { value: 'INACTIVE', label: '비활성' },
                      { value: 'SUSPENDED', label: '정지' },
                    ]}
                    value={statusValue}
                    onChange={(value) => setValue('status', value as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED')}
                  />
                </div>

                <div className="space-y-3">
                  <Checkbox
                    checked={featuredValue || false}
                    onChange={(checked) => setValue('featured', checked)}
                    label="추천 업체"
                    size="md"
                  />
                  <Checkbox
                    checked={verifiedValue || false}
                    onChange={(checked) => setValue('verified', checked)}
                    label="인증 업체"
                    size="md"
                  />
                </div>
              </div>
            </div>

            {/* 기본 정보 */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    업체명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register('name', { required: '업체명을 입력해주세요' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="예: 강남 인테리어"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    간단한 소개 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="description"
                    type="text"
                    {...register('description', { required: '간단한 소개를 입력해주세요' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="예: 20년 경력의 병원 인테리어 전문 업체입니다"
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
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
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register('email', { required: '이메일을 입력해주세요' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="company@example.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
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
                      {...register('address', { required: '주소를 검색해주세요' })}
                      readOnly
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      placeholder="주소 검색 버튼을 클릭하세요"
                    />
                    <button
                      type="button"
                      onClick={handleAddressSearch}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                      주소 검색
                    </button>
                  </div>
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
                </div>

                <div>
                  <label htmlFor="addressDetail" className="block text-sm font-medium text-gray-700 mb-1">
                    상세 주소
                  </label>
                  <input
                    id="addressDetail"
                    type="text"
                    {...register('addressDetail')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="상세 주소를 입력하세요"
                    disabled={!address}
                  />
                </div>
              </div>
            </div>

            {/* 필터 옵션 */}
            {isLoadingFilters ? (
              <div className="bg-white shadow-md rounded-lg p-6">
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">필터 정보를 불러오는 중...</p>
                </div>
              </div>
            ) : (
              filterCategories.length > 0 && (
                <div className="bg-white shadow-md rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">서비스 정보</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    업체의 서비스 지역, 전문 영역 등을 선택해주세요.
                  </p>

                  <div className="space-y-6">
                    {filterCategories.map((category) => (
                      <div key={category.id}>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-700">
                            {category.name}
                            {category.isRequired && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {category.filterType === 'MULTI_SELECT' && (
                            <Checkbox
                              checked={category.options.every(opt =>
                                selectedFilterOptionIds.includes(opt.id)
                              )}
                              onChange={(checked) => {
                                const categoryOptionIds = category.options.map(opt => opt.id)
                                if (checked) {
                                  setSelectedFilterOptionIds([
                                    ...selectedFilterOptionIds.filter(
                                      id => !categoryOptionIds.includes(id)
                                    ),
                                    ...categoryOptionIds,
                                  ])
                                } else {
                                  setSelectedFilterOptionIds(
                                    selectedFilterOptionIds.filter(
                                      id => !categoryOptionIds.includes(id)
                                    )
                                  )
                                }
                              }}
                              label="전체 선택"
                              size="sm"
                            />
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {category.options.map((option) => (
                            <Checkbox
                              key={option.id}
                              checked={selectedFilterOptionIds.includes(option.id)}
                              onChange={(checked) => {
                                if (category.filterType === 'SINGLE_SELECT') {
                                  const categoryOptionIds = category.options.map(opt => opt.id)
                                  const otherIds = selectedFilterOptionIds.filter(
                                    id => !categoryOptionIds.includes(id)
                                  )
                                  setSelectedFilterOptionIds(
                                    checked ? [...otherIds, option.id] : otherIds
                                  )
                                } else {
                                  if (checked) {
                                    setSelectedFilterOptionIds([
                                      ...selectedFilterOptionIds,
                                      option.id,
                                    ])
                                  } else {
                                    setSelectedFilterOptionIds(
                                      selectedFilterOptionIds.filter(id => id !== option.id)
                                    )
                                  }
                                }
                              }}
                              label={option.name}
                              size="sm"
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* 태그/키워드 */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">태그 및 키워드</h2>

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
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
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
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
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
              </div>
            </div>

            {/* 이미지 업로드 */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">이미지</h2>

              <div className="space-y-6">
                <ImageUpload
                  label="로고 이미지"
                  value={logoImage}
                  onChange={(data) => setLogoImage(data as ImageData | undefined)}
                  multiple={false}
                />

                <ImageUpload
                  label="커버 이미지"
                  value={coverImage}
                  onChange={(data) => setCoverImage(data as ImageData | undefined)}
                  multiple={false}
                />

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
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? '등록 중...' : '업체 등록'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </AdminGuard>
  )
}
