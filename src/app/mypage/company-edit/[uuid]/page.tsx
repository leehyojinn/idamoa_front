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

interface FormData {
  // 기본 정보
  name: string
  description: string
  detailContent: string

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
  serviceAreas: string
  tags: string
  keywords: string

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

      // 연락처
      setValue('primaryPhone', company.primaryPhone)
      setValue('secondaryPhone', company.secondaryPhone || '')
      setValue('emergencyContact', company.emergencyContact || '')
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

      // 영업 정보
      setValue('businessHoursNote', company.businessHoursNote || '')
      setValue('serviceAreas', company.serviceAreas?.join(', ') || '')
      setValue('tags', company.tags?.join(', ') || '')
      setValue('keywords', company.keywords?.join(', ') || '')

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
    const fullAddress = data.addressDetail
      ? `${data.address} ${data.addressDetail}`
      : data.address

    // slug 생성 (회사명을 기반으로)
    const slug = data.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

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

      primaryPhone: data.primaryPhone,
      secondaryPhone: data.secondaryPhone || undefined,
      emergencyContact: data.emergencyContact || undefined,
      email: data.email,
      websiteUrl: data.websiteUrl || undefined,
      kakaoChatUrl: data.kakaoChatUrl || undefined,

      address: fullAddress,
      postalCode: data.postalCode,

      businessHoursNote: data.businessHoursNote || undefined,

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
