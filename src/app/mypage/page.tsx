'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { FaStar, FaHeart, FaEye, FaPhone, FaEnvelope, FaMapMarkerAlt, FaEdit, FaCheckCircle, FaCrown } from 'react-icons/fa'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useMyCompany } from '@/hooks/useCompany'
import { showErrorToast } from '@/lib/errorHandler'

// ========================================
// Component
// ========================================

export default function MyPage() {
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // React Query로 회사 정보 조회
  const { data: companyResponse, isLoading, error } = useMyCompany()

  // 인증 체크
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

  // 에러 처리
  useEffect(() => {
    if (error && !isCheckingAuth) {
      showErrorToast(error, '회사 정보를 불러오는데 실패했습니다')
    }
  }, [error, isCheckingAuth])

  // 로딩 중
  if (isCheckingAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  const company = companyResponse?.data

  // 회사 정보 없음
  if (!company) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">등록된 업체 정보가 없습니다</h2>
            <p className="text-gray-600 mb-6">업체 정보를 등록하고 다양한 서비스를 이용해보세요</p>
            <button
              onClick={() => router.push('/mypage/company-register')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              업체 등록하기
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // 대표 이미지 찾기
  const primaryImage = company.images?.find((img) => img.isPrimary)?.imageUrl || company.images?.[0]?.imageUrl

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* 헤더 섹션 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          {/* 커버 이미지 */}
          {primaryImage && (
            <div className="relative w-full h-64 bg-gray-200">
              <Image
                src={primaryImage}
                alt={company.name}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* 기본 정보 */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                  {company.verified && (
                    <span className="flex items-center gap-1 text-blue-600 text-sm">
                      <FaCheckCircle />
                      인증됨
                    </span>
                  )}
                  {company.isPremium && (
                    <span className="flex items-center gap-1 text-yellow-600 text-sm">
                      <FaCrown />
                      프리미엄
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-lg mb-4">{company.description}</p>
              </div>
              <button
                onClick={() => router.push(`/mypage/company-edit/${company.uuid}`)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <FaEdit />
                수정
              </button>
            </div>

            {/* 통계 정보 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 py-4 border-t border-gray-200">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                  <FaStar />
                  <span className="text-xl font-bold text-gray-900">{company.avgRating.toFixed(1)}</span>
                </div>
                <p className="text-sm text-gray-600">평점</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{company.reviewCount.toLocaleString()}</p>
                <p className="text-sm text-gray-600">리뷰</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <FaEye className="text-gray-500" />
                  <span className="text-xl font-bold text-gray-900">{company.viewCount.toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-600">조회수</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <FaHeart className="text-red-500" />
                  <span className="text-xl font-bold text-gray-900">{company.likeCount.toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-600">좋아요</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{company.portfolioCount.toLocaleString()}</p>
                <p className="text-sm text-gray-600">포트폴리오</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{company.completedProjects.toLocaleString()}</p>
                <p className="text-sm text-gray-600">완료 프로젝트</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 상세 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 상세 설명 */}
            {company.detailContent && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">상세 설명</h2>
                <div
                  className="prose max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: company.detailContent }}
                />
              </div>
            )}

            {/* 이미지 갤러리 */}
            {company.images && company.images.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">갤러리</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {company.images.map((image) => (
                    <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-200">
                      <Image
                        src={image.imageUrl}
                        alt={image.title || company.name}
                        fill
                        className="object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 서비스 지역 */}
            {company.serviceAreas && company.serviceAreas.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">서비스 지역</h2>
                <div className="flex flex-wrap gap-2">
                  {company.serviceAreas.map((area, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 태그 */}
            {company.tags && company.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">태그</h2>
                <div className="flex flex-wrap gap-2">
                  {company.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽: 연락처 및 부가 정보 */}
          <div className="space-y-6">
            {/* 연락처 정보 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">연락처</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <FaPhone className="text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">대표 전화</p>
                    <p className="font-semibold text-gray-900">{company.primaryPhone}</p>
                  </div>
                </div>
                {company.secondaryPhone && (
                  <div className="flex items-start gap-3">
                    <FaPhone className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">보조 전화</p>
                      <p className="font-semibold text-gray-900">{company.secondaryPhone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <FaEnvelope className="text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">이메일</p>
                    <p className="font-semibold text-gray-900">{company.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaMapMarkerAlt className="text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">주소</p>
                    <p className="font-semibold text-gray-900">{company.address}</p>
                    <p className="text-sm text-gray-600">{company.postalCode}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 영업 시간 */}
            {company.businessHours && Object.keys(company.businessHours).length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">영업 시간</h2>
                <div className="space-y-2">
                  {Object.entries(company.businessHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="text-gray-600">{day}</span>
                      <span className="text-gray-900 font-medium">{JSON.stringify(hours)}</span>
                    </div>
                  ))}
                </div>
                {company.businessHoursNote && (
                  <p className="mt-3 text-sm text-gray-600 pt-3 border-t">
                    {company.businessHoursNote}
                  </p>
                )}
              </div>
            )}

            {/* 필터 옵션 */}
            {company.filterOptions && company.filterOptions.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">전문 분야</h2>
                <div className="space-y-2">
                  {company.filterOptions.map((option) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                        {option.categoryName}
                      </span>
                      <span className="text-sm text-gray-900">{option.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 상태 정보 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">계정 상태</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">상태</span>
                  <span className="font-semibold text-gray-900">{company.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">추천 업체</span>
                  <span className="font-semibold text-gray-900">{company.featured ? '예' : '아니오'}</span>
                </div>
                {company.verifiedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">인증일</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(company.verifiedAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                )}
                {company.isPremium && company.premiumUntil && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">프리미엄 만료</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(company.premiumUntil).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
