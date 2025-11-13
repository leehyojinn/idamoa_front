'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { FaStar, FaHeart, FaEye, FaPhone, FaEnvelope, FaMapMarkerAlt, FaEdit, FaCheckCircle, FaCrown, FaUser, FaGlobe, FaInstagram, FaFacebook, FaYoutube } from 'react-icons/fa'
import { SiKakaotalk } from 'react-icons/si'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useProfile } from '@/hooks/useProfile'
import { useMyCompany } from '@/hooks/useCompany'
import { showErrorToast } from '@/lib/errorHandler'

// ========================================
// Component
// ========================================

export default function MyPage() {
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // 프로필 정보 조회 (USER or COMPANY)
  const { data: profileResponse, isLoading: profileLoading, error: profileError } = useProfile()

  // COMPANY인 경우 상세 정보 조회 (또는 profile API 실패 시 fallback)
  const isCompanyProfile = profileResponse?.data?.profileType === 'COMPANY'
  const shouldFetchCompany = isCompanyProfile || profileError !== null
  const { data: companyResponse, isLoading: companyLoading, error: companyError } = useMyCompany(shouldFetchCompany)

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
    // Profile API 실패했지만 Company API는 성공한 경우 에러 무시
    if (profileError && !isCheckingAuth && !companyResponse) {
      console.error('Profile Error:', profileError)
      // Company API도 시도해볼 수 있으므로 즉시 에러 표시하지 않음
    }
    if (companyError && !isCheckingAuth && !profileResponse) {
      console.error('Company Error:', companyError)
      showErrorToast(companyError, '정보를 불러오는데 실패했습니다')
    }
  }, [profileError, companyError, isCheckingAuth, profileResponse, companyResponse])

  // 디버깅용 로그
  useEffect(() => {
    console.log('Profile Response:', profileResponse)
    console.log('Company Response:', companyResponse)
  }, [profileResponse, companyResponse])

  // 로딩 중
  if (isCheckingAuth || profileLoading || (shouldFetchCompany && companyLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  const profile = profileResponse?.data
  const company = companyResponse?.data

  // Profile API 실패했지만 Company API는 성공한 경우 - Company 프로필로 간주
  if (!profile && company) {
    const companyProfile = {
      profileType: 'COMPANY' as const,
      id: company.id,
      name: company.name,
      phone: company.primaryPhone,
      email: company.email,
      address: company.address,
      postalCode: company.postalCode,
      bio: company.description,
    }

    const primaryImage = company.images?.find((img) => img.isPrimary)?.imageUrl || company.images?.[0]?.imageUrl

    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />

        <main className="flex-1 container mx-auto px-4 py-8">
          {/* 프로필 기본 정보 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{companyProfile.name}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                  <span className="flex items-center gap-1">
                    <FaPhone className="text-blue-600" />
                    {companyProfile.phone}
                  </span>
                  {companyProfile.email && (
                    <span className="flex items-center gap-1">
                      <FaEnvelope className="text-blue-600" />
                      {companyProfile.email}
                    </span>
                  )}
                  {companyProfile.address && (
                    <span className="flex items-center gap-1">
                      <FaMapMarkerAlt className="text-blue-600" />
                      {companyProfile.address}
                    </span>
                  )}
                </div>
                {companyProfile.bio && (
                  <p className="mt-2 text-gray-600">{companyProfile.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* 업체 상세 정보 */}
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
                  {company.description && (
                    <p className="text-gray-600 text-lg mb-4">{company.description}</p>
                  )}
                </div>
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
                        {image.imageType && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                            {image.imageType}
                          </div>
                        )}
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

              {/* 검색 키워드 */}
              {company.keywords && company.keywords.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">검색 키워드</h2>
                  <div className="flex flex-wrap gap-2">
                    {company.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                      >
                        {keyword}
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
                  {company.emergencyContact && (
                    <div className="flex items-start gap-3">
                      <FaPhone className="text-red-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600">긴급 연락처</p>
                        <p className="font-semibold text-gray-900">{company.emergencyContact}</p>
                      </div>
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-start gap-3">
                      <FaEnvelope className="text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600">이메일</p>
                        <p className="font-semibold text-gray-900">{company.email}</p>
                      </div>
                    </div>
                  )}
                  {company.address && (
                    <div className="flex items-start gap-3">
                      <FaMapMarkerAlt className="text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600">주소</p>
                        <p className="font-semibold text-gray-900">{company.address}</p>
                        {company.postalCode && (
                          <p className="text-sm text-gray-600">{company.postalCode}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 웹사이트 및 소셜 링크 */}
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  {company.websiteUrl && (
                    <a
                      href={company.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <FaGlobe />
                      <span>웹사이트</span>
                    </a>
                  )}
                  {company.kakaoChatUrl && (
                    <a
                      href={company.kakaoChatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 text-sm"
                    >
                      <SiKakaotalk />
                      <span>카카오톡 채널</span>
                    </a>
                  )}
                  {company.socialLinks && (
                    <>
                      {(company.socialLinks as Record<string, string>).instagram && (
                        <a
                          href={(company.socialLinks as Record<string, string>).instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-pink-600 hover:text-pink-700 text-sm"
                        >
                          <FaInstagram />
                          <span>Instagram</span>
                        </a>
                      )}
                      {(company.socialLinks as Record<string, string>).facebook && (
                        <a
                          href={(company.socialLinks as Record<string, string>).facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-700 hover:text-blue-800 text-sm"
                        >
                          <FaFacebook />
                          <span>Facebook</span>
                        </a>
                      )}
                      {(company.socialLinks as Record<string, string>).youtube && (
                        <a
                          href={(company.socialLinks as Record<string, string>).youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm"
                        >
                          <FaYoutube />
                          <span>YouTube</span>
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 영업 시간 */}
              {company.businessHours && Object.keys(company.businessHours).length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">영업 시간</h2>
                  <div className="space-y-2">
                    {(() => {
                      const dayMap: Record<string, string> = {
                        monday: '월요일',
                        tuesday: '화요일',
                        wednesday: '수요일',
                        thursday: '목요일',
                        friday: '금요일',
                        saturday: '토요일',
                        sunday: '일요일'
                      }
                      const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                      const businessHours = company.businessHours as Record<string, string>

                      return dayOrder
                        .filter(day => businessHours[day])
                        .map(day => (
                          <div key={day} className="flex justify-between text-sm">
                            <span className="text-gray-600">{dayMap[day]}</span>
                            <span className="text-gray-900 font-medium">{businessHours[day]}</span>
                          </div>
                        ))
                    })()}
                  </div>
                  {company.businessHoursNote && (
                    <p className="mt-3 text-sm text-gray-600 pt-3 border-t">
                      {company.businessHoursNote}
                    </p>
                  )}
                </div>
              )}

              {/* 사업자 정보 */}
              {company.businessInfo && Object.keys(company.businessInfo).length > 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">사업자 정보</h2>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const businessInfo = company.businessInfo as Record<string, string | number>
                      const hasData = businessInfo.businessRegistrationNumber || businessInfo.representativeName || businessInfo.companyType || businessInfo.establishedYear

                      if (!hasData) {
                        return <p className="text-gray-500">등록된 사업자 정보가 없습니다</p>
                      }

                      return (
                        <>
                          {businessInfo.businessRegistrationNumber && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">사업자번호</span>
                              <span className="font-semibold text-gray-900">
                                {String(businessInfo.businessRegistrationNumber)}
                              </span>
                            </div>
                          )}
                          {businessInfo.representativeName && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">대표자명</span>
                              <span className="font-semibold text-gray-900">
                                {String(businessInfo.representativeName)}
                              </span>
                            </div>
                          )}
                          {businessInfo.companyType && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">업체 형태</span>
                              <span className="font-semibold text-gray-900">
                                {(() => {
                                  const typeMap: Record<string, string> = {
                                    individual: '개인사업자',
                                    corporation: '법인사업자',
                                    other: '기타'
                                  }
                                  return typeMap[String(businessInfo.companyType)] || String(businessInfo.companyType)
                                })()}
                              </span>
                            </div>
                          )}
                          {businessInfo.establishedYear && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">설립 연도</span>
                              <span className="font-semibold text-gray-900">
                                {String(businessInfo.establishedYear)}년
                              </span>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">사업자 정보</h2>
                  <p className="text-gray-500 text-sm">등록된 사업자 정보가 없습니다</p>
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

              {/* 계정 설정 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">계정 설정</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push('/mypage/company-register')}
                    className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    업체 상세정보 수정
                  </button>
                  <button
                    onClick={() => router.push('/mypage/password-change')}
                    className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    비밀번호 변경
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  // 프로필 정보 없음 (Profile과 Company 둘 다 실패)
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">등록된 프로필이 없습니다</h2>
            <p className="text-gray-600 mb-6">프로필을 등록하고 다양한 서비스를 이용해보세요</p>
            <button
              onClick={() => router.push('/profile-setup')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              프로필 등록하기
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // USER 프로필인 경우
  if (profile.profileType === 'USER_PROFILE') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />

        <main className="flex-1 container mx-auto px-4 py-8">
          {/* 헤더 섹션 */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  {profile.avatarUrl ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                      <Image
                        src={profile.avatarUrl}
                        alt={profile.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                      <FaUser className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                    {profile.nickname && (
                      <p className="text-lg text-gray-600 mt-1">@{profile.nickname}</p>
                    )}
                    {profile.bio && (
                      <p className="text-gray-600 mt-2">{profile.bio}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => router.push('/mypage/profile-edit')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  <FaEdit />
                  수정
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 기본 정보 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">기본 정보</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <FaPhone className="text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">전화번호</p>
                    <p className="font-semibold text-gray-900">{profile.phone}</p>
                  </div>
                </div>
                {profile.email && (
                  <div className="flex items-start gap-3">
                    <FaEnvelope className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">이메일</p>
                      <p className="font-semibold text-gray-900">{profile.email}</p>
                    </div>
                  </div>
                )}
                {profile.address && (
                  <div className="flex items-start gap-3">
                    <FaMapMarkerAlt className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">주소</p>
                      <p className="font-semibold text-gray-900">{profile.address}</p>
                      {profile.postalCode && (
                        <p className="text-sm text-gray-600">{profile.postalCode}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 계정 설정 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">계정 설정</h2>
              {profile.profileVisibility && (
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">프로필 공개 설정</span>
                    <span className="font-semibold text-gray-900">
                      {profile.profileVisibility === 'PUBLIC' ? '전체 공개' :
                       profile.profileVisibility === 'PRIVATE' ? '비공개' : '친구 공개'}
                    </span>
                  </div>
                </div>
              )}

              {/* 비밀번호 변경 버튼 */}
              <button
                onClick={() => router.push('/mypage/password-change')}
                className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
              >
                비밀번호 변경
              </button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  // COMPANY 프로필인 경우 - company 상세 정보가 없어도 profile 정보는 보여줌
  if (!company) {
    // Profile 정보만으로 기본 화면 표시
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />

        <main className="flex-1 container mx-auto px-4 py-8">
          {/* 프로필 기본 정보 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{profile.name}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                  <span className="flex items-center gap-1">
                    <FaPhone className="text-blue-600" />
                    {profile.phone}
                  </span>
                  {profile.email && (
                    <span className="flex items-center gap-1">
                      <FaEnvelope className="text-blue-600" />
                      {profile.email}
                    </span>
                  )}
                  {profile.address && (
                    <span className="flex items-center gap-1">
                      <FaMapMarkerAlt className="text-blue-600" />
                      {profile.address}
                    </span>
                  )}
                </div>
                {profile.bio && (
                  <p className="mt-2 text-gray-600">{profile.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* 업체 등록 안내 */}
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">업체 상세 정보 등록</h3>
            <p className="text-gray-600 mb-6">
              업체 상세 정보를 등록하면 더 많은 기능을 이용할 수 있습니다
            </p>
            <button
              onClick={() => router.push('/mypage/company-register')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              업체 상세 정보 등록하기
            </button>
          </div>

          {/* 기본 정보 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">기본 정보</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <FaPhone className="text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">전화번호</p>
                    <p className="font-semibold text-gray-900">{profile.phone}</p>
                  </div>
                </div>
                {profile.email && (
                  <div className="flex items-start gap-3">
                    <FaEnvelope className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">이메일</p>
                      <p className="font-semibold text-gray-900">{profile.email}</p>
                    </div>
                  </div>
                )}
                {profile.address && (
                  <div className="flex items-start gap-3">
                    <FaMapMarkerAlt className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">주소</p>
                      <p className="font-semibold text-gray-900">{profile.address}</p>
                      {profile.postalCode && (
                        <p className="text-sm text-gray-600">{profile.postalCode}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 계정 설정 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">계정 설정</h2>
              <button
                onClick={() => router.push('/mypage/password-change')}
                className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
              >
                비밀번호 변경
              </button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  // COMPANY 프로필 - 상세 정보 표시
  const primaryImage = company.images?.find((img) => img.isPrimary)?.imageUrl || company.images?.[0]?.imageUrl

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* 프로필 기본 정보 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{profile.name}</h2>
              <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                <span className="flex items-center gap-1">
                  <FaPhone className="text-blue-600" />
                  {profile.phone}
                </span>
                {profile.email && (
                  <span className="flex items-center gap-1">
                    <FaEnvelope className="text-blue-600" />
                    {profile.email}
                  </span>
                )}
                {profile.address && (
                  <span className="flex items-center gap-1">
                    <FaMapMarkerAlt className="text-blue-600" />
                    {profile.address}
                  </span>
                )}
              </div>
              {profile.bio && (
                <p className="mt-2 text-gray-600">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* 업체 상세 정보 */}
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
                {company.description && (
                  <p className="text-gray-600 text-lg mb-4">{company.description}</p>
                )}
              </div>
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
                      {image.imageType && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                          {image.imageType}
                        </div>
                      )}
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

            {/* 검색 키워드 */}
            {company.keywords && company.keywords.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">검색 키워드</h2>
                <div className="flex flex-wrap gap-2">
                  {company.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                    >
                      {keyword}
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
                {company.emergencyContact && (
                  <div className="flex items-start gap-3">
                    <FaPhone className="text-red-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">긴급 연락처</p>
                      <p className="font-semibold text-gray-900">{company.emergencyContact}</p>
                    </div>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-start gap-3">
                    <FaEnvelope className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">이메일</p>
                      <p className="font-semibold text-gray-900">{company.email}</p>
                    </div>
                  </div>
                )}
                {company.address && (
                  <div className="flex items-start gap-3">
                    <FaMapMarkerAlt className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">주소</p>
                      <p className="font-semibold text-gray-900">{company.address}</p>
                      {company.postalCode && (
                        <p className="text-sm text-gray-600">{company.postalCode}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 웹사이트 및 소셜 링크 */}
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                {company.websiteUrl && (
                  <a
                    href={company.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <FaGlobe />
                    <span>웹사이트</span>
                  </a>
                )}
                {company.kakaoChatUrl && (
                  <a
                    href={company.kakaoChatUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 text-sm"
                  >
                    <SiKakaotalk />
                    <span>카카오톡 채널</span>
                  </a>
                )}
                {company.socialLinks && (
                  <>
                    {(company.socialLinks as Record<string, string>).instagram && (
                      <a
                        href={(company.socialLinks as Record<string, string>).instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-pink-600 hover:text-pink-700 text-sm"
                      >
                        <FaInstagram />
                        <span>Instagram</span>
                      </a>
                    )}
                    {(company.socialLinks as Record<string, string>).facebook && (
                      <a
                        href={(company.socialLinks as Record<string, string>).facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-700 hover:text-blue-800 text-sm"
                      >
                        <FaFacebook />
                        <span>Facebook</span>
                      </a>
                    )}
                    {(company.socialLinks as Record<string, string>).youtube && (
                      <a
                        href={(company.socialLinks as Record<string, string>).youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm"
                      >
                        <FaYoutube />
                        <span>YouTube</span>
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 영업 시간 */}
            {company.businessHours && Object.keys(company.businessHours).length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">영업 시간</h2>
                <div className="space-y-2">
                  {(() => {
                    const dayMap: Record<string, string> = {
                      monday: '월요일',
                      tuesday: '화요일',
                      wednesday: '수요일',
                      thursday: '목요일',
                      friday: '금요일',
                      saturday: '토요일',
                      sunday: '일요일'
                    }
                    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                    const businessHours = company.businessHours as Record<string, string>

                    return dayOrder
                      .filter(day => businessHours[day])
                      .map(day => (
                        <div key={day} className="flex justify-between text-sm">
                          <span className="text-gray-600">{dayMap[day]}</span>
                          <span className="text-gray-900 font-medium">{businessHours[day]}</span>
                        </div>
                      ))
                  })()}
                </div>
                {company.businessHoursNote && (
                  <p className="mt-3 text-sm text-gray-600 pt-3 border-t">
                    {company.businessHoursNote}
                  </p>
                )}
              </div>
            )}

            {/* 사업자 정보 */}
            {company.businessInfo && Object.keys(company.businessInfo).length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">사업자 정보</h2>
                <div className="space-y-2 text-sm">
                  {(() => {
                    const businessInfo = company.businessInfo as Record<string, string | number>
                    const hasData = businessInfo.businessRegistrationNumber || businessInfo.representativeName || businessInfo.companyType || businessInfo.establishedYear

                    if (!hasData) {
                      return <p className="text-gray-500">등록된 사업자 정보가 없습니다</p>
                    }

                    return (
                      <>
                        {businessInfo.businessRegistrationNumber && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">사업자번호</span>
                            <span className="font-semibold text-gray-900">
                              {String(businessInfo.businessRegistrationNumber)}
                            </span>
                          </div>
                        )}
                        {businessInfo.representativeName && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">대표자명</span>
                            <span className="font-semibold text-gray-900">
                              {String(businessInfo.representativeName)}
                            </span>
                          </div>
                        )}
                        {businessInfo.companyType && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">업체 형태</span>
                            <span className="font-semibold text-gray-900">
                              {(() => {
                                const typeMap: Record<string, string> = {
                                  individual: '개인사업자',
                                  corporation: '법인사업자',
                                  other: '기타'
                                }
                                return typeMap[String(businessInfo.companyType)] || String(businessInfo.companyType)
                              })()}
                            </span>
                          </div>
                        )}
                        {businessInfo.establishedYear && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">설립 연도</span>
                            <span className="font-semibold text-gray-900">
                              {String(businessInfo.establishedYear)}년
                            </span>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">사업자 정보</h2>
                <p className="text-gray-500 text-sm">등록된 사업자 정보가 없습니다</p>
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

            {/* 계정 설정 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">계정 설정</h2>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/mypage/company-register')}
                  className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  업체 상세정보 수정
                </button>
                <button
                  onClick={() => router.push('/mypage/password-change')}
                  className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                >
                  비밀번호 변경
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
