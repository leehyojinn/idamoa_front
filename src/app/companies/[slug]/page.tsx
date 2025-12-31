import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  IoEye,
  IoCheckmarkCircle,
  IoLocationOutline,
  IoCallOutline,
  IoMailOutline,
  IoGlobeOutline,
  IoTimeOutline,
  IoLogoInstagram,
  IoLogoYoutube,
  IoLogoFacebook,
  IoLogoTwitter,
  IoArrowBack,
} from 'react-icons/io5'
import { FiStar } from 'react-icons/fi'
import { SiKakaotalk, SiNaver } from 'react-icons/si'
import { getCompanyBySlug, getCompanyByUuid, type CompanyResponse } from '@/lib/api/company'
import { DAY_MAP, DAY_ORDER } from '@/lib/constants'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CompanyLikeButton from '@/components/company/CompanyLikeButton'
import CompanyReviewsWrapper from '@/components/company/CompanyReviewsWrapper'
import CompanyChatButton from '@/components/company/CompanyChatButton'
import { LocalBusinessSchema, BreadcrumbSchema } from '@/components/seo/JsonLd'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

// UUID 형식인지 확인하는 헬퍼 함수
const isUuid = (str: string): boolean => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidPattern.test(str)
}

// SEO 메타데이터 생성
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const result = isUuid(slug)
      ? await getCompanyByUuid(slug)
      : await getCompanyBySlug(slug)

    if (!result.success || !result.data) {
      return {
        title: '업체를 찾을 수 없습니다',
      }
    }

    const company = result.data
    const primaryImage = company.images?.find((img) => img.isPrimary)?.imageUrl ||
                        company.images?.[0]?.imageUrl ||
                        '/images/img-placeholder.png'

    return {
      title: `${company.name} - 다모아`,
      description: company.description || `${company.name}의 상세 정보를 확인하세요. 평점 ${company.avgRating.toFixed(1)}, ${company.reviewCount}개의 리뷰, ${company.completedProjects}건의 완료 프로젝트.`,
      keywords: company.tags?.join(', '),
      openGraph: {
        title: company.name,
        description: company.description,
        images: [
          {
            url: primaryImage,
            width: 1200,
            height: 630,
            alt: company.name,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: company.name,
        description: company.description,
        images: [primaryImage],
      },
    }
  } catch (error) {
    return {
      title: '업체를 찾을 수 없습니다',
    }
  }
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { slug } = await params

  let result
  try {
    result = isUuid(slug)
      ? await getCompanyByUuid(slug)
      : await getCompanyBySlug(slug)
  } catch (error) {
    console.error('업체 상세 로드 실패:', error)
    notFound()
  }

  if (!result?.success || !result?.data) {
    notFound()
  }

  const company: CompanyResponse = result.data

  const getPrimaryImage = () => {
    if (!company?.images || company.images.length === 0) {
      return '/images/img-placeholder.png'
    }
    return (
      company.images.find((img) => img.isPrimary)?.imageUrl ||
      company.images[0]?.imageUrl ||
      '/images/img-placeholder.png'
    )
  }

  const companyUrl = `https://i-damoa.com/companies/${company.slug || company.uuid}`

  return (
    <>
      <LocalBusinessSchema
        name={company.name}
        description={company.description}
        url={companyUrl}
        image={getPrimaryImage()}
        address={company.address}
        telephone={company.primaryPhone}
        email={company.email}
        rating={company.avgRating}
        reviewCount={company.reviewCount}
      />
      <BreadcrumbSchema
        items={[
          { name: '홈', url: 'https://i-damoa.com' },
          { name: '업체찾기', url: 'https://i-damoa.com/companies' },
          { name: company.name, url: companyUrl },
        ]}
      />
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* 커버 이미지 섹션 */}
        <div className="relative h-[400px] bg-gray-900">
          <Image
            src={getPrimaryImage()}
            alt={company.name}
            fill
            className="object-cover opacity-80"
            priority
          />

          {/* 그라데이션 오버레이 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* 배지 */}
          <div className="absolute top-6 left-6 flex gap-2">
            {company.isPremium && company.premiumTier && (
              <span
                className={`
                  px-4 py-1.5 rounded-full text-sm font-bold text-white shadow-lg backdrop-blur-sm
                  ${
                    company.premiumTier === 'GOLD'
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                      : company.premiumTier === 'SILVER'
                      ? 'bg-gradient-to-r from-gray-300 to-gray-500'
                      : 'bg-gradient-to-r from-orange-400 to-orange-600'
                  }
                `}
              >
                {company.premiumTier}
              </span>
            )}
            {company.featured && (
              <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-red-500 text-white shadow-lg backdrop-blur-sm">
                추천
              </span>
            )}
          </div>

          {/* 뒤로가기 버튼 */}
          <Link
            href="/"
            className="absolute top-6 right-6 inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-900 rounded-lg hover:bg-white transition-all shadow-lg"
          >
            <IoArrowBack className="w-5 h-5" />
            <span className="font-medium">목록으로</span>
          </Link>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="max-w-6xl mx-auto px-4 -mt-24 mb-20 relative z-10">
          {/* 헤더 카드 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* 왼쪽: 업체 정보 */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-4xl font-bold text-gray-900">
                    {company.name}
                  </h1>
                  {company.verified && (
                    <IoCheckmarkCircle className="text-blue-500 text-3xl" />
                  )}
                </div>

                {/* 평점 및 통계 */}
                <div className="flex flex-wrap items-center gap-6 mb-4">
                  <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg">
                    <FiStar className="fill-current text-yellow-500 text-2xl" />
                    <span className="font-bold text-2xl text-gray-900">
                      {company.avgRating.toFixed(1)}
                    </span>
                    <span className="text-gray-600">
                      ({company.reviewCount})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                    <IoEye className="text-gray-400 text-xl" />
                    <span className="font-semibold text-gray-700">{company.viewCount.toLocaleString()}</span>
                  </div>
                </div>

                {/* 설명 */}
                {company.description && (
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {company.description}
                  </p>
                )}
              </div>

              {/* 오른쪽: 액션 버튼 */}
              <div className="lg:w-auto">
                <CompanyLikeButton
                  companyUuid={company.uuid}
                  initialIsLiked={company.isLiked}
                  initialLikeCount={company.likeCount}
                />
              </div>
            </div>
          </div>

          {/* 2열 그리드 레이아웃 */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            {/* 왼쪽 컬럼 - 연락처 & 영업시간 */}
            <div className="lg:col-span-1 space-y-6">
              {/* 연락처 정보 카드 */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <IoCallOutline className="text-primary text-2xl" />
                  연락처
                </h2>
                <div className="space-y-4">
                  {company.primaryPhone && (
                    <div className="flex items-start gap-3">
                      <IoCallOutline className="text-gray-400 text-xl flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">전화번호</p>
                        <p className="text-gray-900 font-medium">{company.primaryPhone}</p>
                      </div>
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-start gap-3">
                      <IoMailOutline className="text-gray-400 text-xl flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">이메일</p>
                        <p className="text-gray-900 font-medium break-all">{company.email}</p>
                      </div>
                    </div>
                  )}
                  {company.address && (
                    <div className="flex items-start gap-3">
                      <IoLocationOutline className="text-gray-400 text-xl flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">주소</p>
                        <p className="text-gray-900 font-medium">{company.address}</p>
                      </div>
                    </div>
                  )}
                  {company.websiteUrl && (
                    <div className="flex items-start gap-3">
                      <IoGlobeOutline className="text-gray-400 text-xl flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">웹사이트</p>
                        <a
                          href={company.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium break-all"
                        >
                          {company.websiteUrl}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* 채팅 버튼 */}
                {company.ownerUuid && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <CompanyChatButton
                      ownerUuid={company.ownerUuid}
                      companyName={company.name}
                      className="w-full justify-center"
                    />
                  </div>
                )}
              </div>

              {/* 영업 시간 카드 */}
              {company.businessHours && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <IoTimeOutline className="text-primary text-2xl" />
                    영업 시간
                  </h2>
                  {company.businessHoursNote && (
                    <p className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 rounded-lg">
                      {company.businessHoursNote}
                    </p>
                  )}
                  <div className="space-y-2">
                    {DAY_ORDER.map((day) => {
                      const hours = (company.businessHours as Record<string, string>)?.[day]
                      if (!hours) return null
                      return (
                        <div key={day} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                          <span className="text-gray-600 font-medium">{DAY_MAP[day]}</span>
                          <span className="font-semibold text-gray-900">{hours}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 오른쪽 컬럼 - 상세 설명 & 기타 정보 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 상세 설명 카드 */}
              {company.detailContent && (
                <div className="bg-white rounded-xl shadow-md p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    상세 정보
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {company.detailContent}
                  </div>
                </div>
              )}

              {/* 갤러리 */}
              {company.images && company.images.length > 1 && (
                <div className="bg-white rounded-xl shadow-md p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    갤러리
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {company.images.map((image) => (
                      <div
                        key={image.id}
                        className="relative aspect-square rounded-xl overflow-hidden bg-gray-200 hover:scale-105 transition-transform duration-300 shadow-md hover:shadow-xl cursor-pointer group"
                      >
                        <Image
                          src={image.imageUrl}
                          alt={image.title || company.name}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 전문 분야 및 서비스 - 전체 너비 */}
          {((company.filterGroups && company.filterGroups.length > 0) || (company.tags && company.tags.length > 0)) && (
            <div className="bg-white rounded-xl shadow-md p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">전문 분야 및 서비스</h2>
              <div className="space-y-6">
                {/* 필터 그룹 표시 */}
                {company.filterGroups && company.filterGroups.length > 0 && (
                  <>
                    {company.filterGroups.map((filterGroup) => (
                      <div key={filterGroup.categoryId}>
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                          {filterGroup.categoryCode === 'region' && (
                            <IoLocationOutline className="text-blue-600" />
                          )}
                          {filterGroup.categoryName}
                        </h3>
                        {filterGroup.categoryDescription && (
                          <p className="text-sm text-gray-600 mb-3">{filterGroup.categoryDescription}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {filterGroup.options.map((option) => (
                            <span
                              key={option.id}
                              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full font-medium hover:bg-blue-100 transition-colors"
                            >
                              {option.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* 태그 표시 */}
                {company.tags && company.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                      태그
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {company.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full font-medium hover:bg-purple-100 transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SNS 링크 - 연락처 카드에 통합 또는 별도 표시 */}
          {(company.kakaoChatUrl ||
            (company.socialLinks && Object.keys(company.socialLinks).length > 0)) && (
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-md p-8 mb-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <IoGlobeOutline className="text-primary" />
                소셜 미디어
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {company.kakaoChatUrl && (
                  <a
                    href={company.kakaoChatUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-5 py-3 bg-yellow-400 text-gray-900 rounded-xl hover:bg-yellow-500 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    title="카카오톡"
                  >
                    <SiKakaotalk className="w-5 h-5" />
                    <span className="font-semibold text-sm">카카오톡</span>
                  </a>
                )}
                {company.socialLinks?.instagram && typeof company.socialLinks.instagram === 'string' ? (
                  <a
                    href={company.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-5 py-3 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 text-white rounded-xl hover:opacity-90 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    title="Instagram"
                  >
                    <IoLogoInstagram className="w-5 h-5" />
                    <span className="font-semibold text-sm">Instagram</span>
                  </a>
                ) : null}
                {company.socialLinks?.youtube && typeof company.socialLinks.youtube === 'string' ? (
                  <a
                    href={company.socialLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-5 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    title="YouTube"
                  >
                    <IoLogoYoutube className="w-5 h-5" />
                    <span className="font-semibold text-sm">YouTube</span>
                  </a>
                ) : null}
                {company.socialLinks?.facebook && typeof company.socialLinks.facebook === 'string' ? (
                  <a
                    href={company.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    title="Facebook"
                  >
                    <IoLogoFacebook className="w-5 h-5" />
                    <span className="font-semibold text-sm">Facebook</span>
                  </a>
                ) : null}
                {company.socialLinks?.twitter && typeof company.socialLinks.twitter === 'string' ? (
                  <a
                    href={company.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-5 py-3 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    title="Twitter"
                  >
                    <IoLogoTwitter className="w-5 h-5" />
                    <span className="font-semibold text-sm">Twitter</span>
                  </a>
                ) : null}
                {company.socialLinks?.naver && typeof company.socialLinks.naver === 'string' ? (
                  <a
                    href={company.socialLinks.naver}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-5 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    title="네이버"
                  >
                    <SiNaver className="w-5 h-5" />
                    <span className="font-semibold text-sm">네이버</span>
                  </a>
                ) : null}
                {company.socialLinks?.blog && typeof company.socialLinks.blog === 'string' ? (
                  <a
                    href={company.socialLinks.blog}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    title="블로그"
                  >
                    <SiNaver className="w-5 h-5" />
                    <span className="font-semibold text-sm">블로그</span>
                  </a>
                ) : null}
              </div>
            </div>
          )}

          {/* 리뷰 */}
          <div className="bg-white rounded-xl shadow-md p-8">
            <CompanyReviewsWrapper
              companyUuid={company.uuid}
              companyName={company.name}
              companyOwnerEmail={company.ownerEmail}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
