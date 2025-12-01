'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'
import ImageUpload, { type ImageData } from '@/components/ui/ImageUpload'
import Checkbox from '@/components/ui/Checkbox'
import Select from '@/components/ui/Select'
import { useKakaoAddress } from '@/hooks/useKakaoAddress'
import {
  getAdminCompany,
  updateAdminCompany,
  type AdminUpdateCompanyData,
} from '@/lib/api/company'
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

  // 관리자 전용 필드
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  featured: boolean
  verified: boolean
}

export default function AdminCompanyEditPage() {
  const router = useRouter()
  const params = useParams()
  const uuid = params?.uuid as string
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
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
  } = useForm<FormData>()

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

  // 업체 정보 로드
  useEffect(() => {
    const loadCompany = async () => {
      if (!uuid) return

      try {
        const response = await getAdminCompany(uuid)
        if (!response.success || !response.data) {
          showErrorToast(null, '업체 정보를 찾을 수 없습니다')
          router.push('/admin/companies')
          return
        }

        const company = response.data

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
          if (businessInfo.businessRegistrationNumber)
            setValue('businessRegistrationNumber', formatBusinessNumber(businessInfo.businessRegistrationNumber))
          if (businessInfo.representativeName)
            setValue('representativeName', businessInfo.representativeName)
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

        // 필터 옵션
        if (company.filterGroups && company.filterGroups.length > 0) {
          const optionIds = company.filterGroups.flatMap(group =>
            group.options.map(option => option.id)
          )
          setSelectedFilterOptionIds(optionIds)
        }

        // 태그
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

          if (logo) setLogoImage({ uuid: logo.fileUuid, url: logo.imageUrl })
          if (cover) setCoverImage({ uuid: cover.fileUuid, url: cover.imageUrl })
          if (gallery.length > 0) {
            setGalleryImages(gallery.map(img => ({ uuid: img.fileUuid, url: img.imageUrl })))
          }
        }

        // 관리자 전용 필드
        setValue('status', company.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED')
        setValue('featured', company.featured)
        setValue('verified', company.verified)

        setIsLoading(false)
      } catch (error) {
        showErrorToast(error, '업체 정보를 불러오는데 실패했습니다')
        router.push('/admin/companies')
      }
    }

    loadCompany()
  }, [uuid, router, setValue])

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

      // 사업자 정보 객체
      const businessInfo: Record<string, string> = {}
      if (data.businessRegistrationNumber) businessInfo.businessRegistrationNumber = data.businessRegistrationNumber
      if (data.representativeName) businessInfo.representativeName = data.representativeName
      if (data.companyType) businessInfo.companyType = data.companyType

      // 영업시간 객체
      const businessHours: Record<string, string> = {}
      if (data.mondayHours) businessHours.monday = data.mondayHours
      if (data.tuesdayHours) businessHours.tuesday = data.tuesdayHours
      if (data.wednesdayHours) businessHours.wednesday = data.wednesdayHours
      if (data.thursdayHours) businessHours.thursday = data.thursdayHours
      if (data.fridayHours) businessHours.friday = data.fridayHours
      if (data.saturdayHours) businessHours.saturday = data.saturdayHours
      if (data.sundayHours) businessHours.sunday = data.sundayHours

      // SNS 링크 객체
      const socialLinks: Record<string, string> = {}
      if (data.facebookUrl) socialLinks.facebook = data.facebookUrl
      if (data.instagramUrl) socialLinks.instagram = data.instagramUrl
      if (data.youtubeUrl) socialLinks.youtube = data.youtubeUrl
      if (data.blogUrl) socialLinks.blog = data.blogUrl

      const updateData: AdminUpdateCompanyData = {
        name: data.name,
        description: data.description,
        detailContent: data.detailContent || undefined,
        detailContentFormat: 'text',

        businessInfo: Object.keys(businessInfo).length > 0 ? businessInfo : undefined,
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

        filterOptionIds: selectedFilterOptionIds.length > 0 ? selectedFilterOptionIds : undefined,
        tags: tags.length > 0 ? tags : undefined,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,

        logoImageUuid: logoImage?.uuid,
        coverImageUuid: coverImage?.uuid,
        galleryImageUuids: galleryImages.length > 0 ? galleryImages.map(img => img.uuid) : undefined,

        // 관리자 전용 필드
        status: data.status,
        featured: data.featured,
        verified: data.verified,
      }

      await updateAdminCompany(uuid, updateData)
      showSuccessToast('업체 정보가 수정되었습니다!')
      router.push('/admin/companies')
    } catch (error) {
      showErrorToast(error, '업체 수정 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
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
    <AdminGuard>
      <Navbar showQuickmenu={false} />
      <main className="flex-1 bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">업체 정보 수정</h1>
            <p className="mt-2 text-sm text-gray-600">업체 정보를 수정합니다</p>
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
                    disabled={!address}
                  />
                </div>
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
                {isSubmitting ? '수정 중...' : '업체 정보 수정'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </AdminGuard>
  )
}
