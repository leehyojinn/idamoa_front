'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { FaStar, FaHeart, FaEye, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCheckCircle, FaCrown, FaUser, FaGlobe, FaInstagram, FaFacebook, FaYoutube, FaAward } from 'react-icons/fa'
import { SiKakaotalk, SiNaver } from 'react-icons/si'
import DOMPurify from 'isomorphic-dompurify'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useProfile } from '@/hooks/useProfile'
import { useMyCompany } from '@/hooks/useCompany'
import { useAuthStore } from '@/stores/authStore'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { formatPhoneNumber } from '@/lib/utils'
import { deleteCompany } from '@/lib/api/company'
import { DAY_MAP, DAY_ORDER } from '@/lib/constants'
import { useQuery } from '@tanstack/react-query'
import { useDialogStore } from '@/stores/useDialogStore'
import { getCreditBalance } from '@/lib/api/credit'
import { IoCash } from 'react-icons/io5'

// ========================================
// Component
// ========================================

export default function MyPage() {
  const router = useRouter()
  const { accessToken, _hasHydrated } = useAuthStore()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const { showDialog } = useDialogStore()

  // 프로필 정보 조회 (USER or COMPANY)
  const { data: profileResponse, isLoading: profileLoading, error: profileError } = useProfile()

  // COMPANY인 경우 먼저 업체 등록 여부 확인
  const isCompanyProfile = profileResponse?.data?.profileType === 'COMPANY'
  const shouldCheckCompany = isCompanyProfile && !profileLoading
  const { data: checkResponse, isLoading: checkLoading } = useQuery({
    queryKey: ['companies', 'check'],
    queryFn: async () => {
      const { checkCompanyExists } = await import('@/lib/api/company')
      return checkCompanyExists()
    },
    enabled: shouldCheckCompany,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  // 업체 등록 여부에 따라 상세 정보 조회
  const shouldFetchCompany = isCompanyProfile && checkResponse?.data?.hasCompany === true
  const { data: companyResponse, isLoading: companyLoading, error: companyError } = useMyCompany(shouldFetchCompany)

  // 크레딧 잔액 조회
  const { data: creditBalanceResponse } = useQuery({
    queryKey: ['credits', 'balance'],
    queryFn: getCreditBalance,
    enabled: !isCheckingAuth && !!accessToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

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

  // 에러 처리
  useEffect(() => {
    // Profile API 실패했지만 Company API는 성공한 경우 에러 무시
    if (profileError && !isCheckingAuth && !companyResponse) {
      // Company API도 시도해볼 수 있으므로 즉시 에러 표시하지 않음
    }
    if (companyError && !isCheckingAuth && !profileResponse) {
      showErrorToast(companyError, '정보를 불러오는데 실패했습니다')
    }
  }, [profileError, companyError, isCheckingAuth, profileResponse, companyResponse])

  // 업체 삭제 처리
  const handleDeleteCompany = () => {
    if (!company?.uuid) {
      showErrorToast(null, '업체 정보를 찾을 수 없습니다')
      return
    }

    // 첫 번째 확인 다이얼로그
    showDialog({
      title: '업체 삭제',
      message: '정말로 업체를 삭제하시겠습니까?\n\n삭제된 업체는 복구할 수 없으며, 다음 정보가 영구적으로 삭제됩니다:\n\n• 업체 기본 정보\n• 업체 상세 정보\n• 업체 이미지\n\n삭제 후 새로운 업체를 다시 등록할 수 있습니다.',
      type: 'confirm',
      confirmText: '다음',
      cancelText: '취소',
      onConfirm: () => {
        // 두 번째 확인 다이얼로그 (다음 틱에 열기)
        setTimeout(() => {
          showDialog({
            title: '최종 확인',
            message: '정말로 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.',
            type: 'confirm',
            confirmText: '삭제',
            cancelText: '취소',
            onConfirm: async () => {
              setIsDeleting(true)

              try {
                const result = await deleteCompany(company.uuid)

                if (result.success) {
                  showSuccessToast('업체가 삭제되었습니다.')
                  // 1초 후 마이페이지 새로고침
                  setTimeout(() => {
                    window.location.reload()
                  }, 1000)
                } else {
                  showErrorToast(null, result.message || '업체 삭제에 실패했습니다')
                }
              } catch (error) {
                showErrorToast(error, '업체 삭제 중 오류가 발생했습니다')
              } finally {
                setIsDeleting(false)
              }
            },
          })
        }, 100)
      },
    })
  }

  // 로딩 중
  if (isCheckingAuth || profileLoading || (isCompanyProfile && checkLoading) || (shouldFetchCompany && companyLoading)) {
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
              onClick={() => router.push('/signup/profile-type')}
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
              </div>
            </div>
          </div>

          {/* 크레딧 정보 */}
          {creditBalanceResponse?.data && (
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <IoCash className="text-2xl" />
                    <h2 className="text-lg font-semibold">크레딧 잔액</h2>
                  </div>
                  <p className="text-3xl font-bold mb-1">{creditBalanceResponse.data.balance.toLocaleString()} 원</p>
                  <p className="text-sm opacity-90">다양한 서비스 이용이 가능합니다</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => router.push('/mypage/credits/purchase')}
                    className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm"
                  >
                    충전하기
                  </button>
                  <button
                    onClick={() => router.push('/mypage/credits/transactions')}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    내역 보기
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 기본 정보 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">기본 정보</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <FaPhone className="text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">전화번호</p>
                    <p className="font-semibold text-gray-900">{formatPhoneNumber(profile.phone)}</p>
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

              <div className="space-y-2">
                <button
                  onClick={() => router.push('/mypage/profile-edit')}
                  className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  내 정보 수정
                </button>
                <button
                  onClick={() => router.push('/inquiries/my')}
                  className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                >
                  내 문의 내역
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
                    {formatPhoneNumber(profile.phone)}
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

          {/* 크레딧 정보 */}
          {creditBalanceResponse?.data && (
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <IoCash className="text-2xl" />
                    <h2 className="text-lg font-semibold">크레딧 잔액</h2>
                  </div>
                  <p className="text-3xl font-bold mb-1">{creditBalanceResponse.data.balance.toLocaleString()} 원</p>
                  <p className="text-sm opacity-90">다양한 서비스 이용이 가능합니다</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => router.push('/mypage/credits/purchase')}
                    className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm"
                  >
                    충전하기
                  </button>
                  <button
                    onClick={() => router.push('/mypage/credits/transactions')}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    내역 보기
                  </button>
                </div>
              </div>
            </div>
          )}

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
                    <p className="font-semibold text-gray-900">{formatPhoneNumber(profile.phone)}</p>
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
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/mypage/company-profile-edit')}
                  className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  업체 기본 정보 수정
                </button>
                <button
                  onClick={() => router.push('/mypage/promoted-galleries')}
                  className="w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <FaAward />
                  내 우대 갤러리
                </button>
                <button
                  onClick={() => router.push('/inquiries/my')}
                  className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                >
                  내 문의 내역
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
        </main>

        <Footer />
      </div>
    )
  }

  // COMPANY 프로필 - 상세 정보 표시
  if (!company) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">업체 정보를 불러올 수 없습니다</h2>
            <p className="text-gray-600 mb-6">잠시 후 다시 시도해주세요</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const primaryImage = company.images?.find((img) => img.isPrimary)?.imageUrl || company.images?.[0]?.imageUrl || '/images/img-placeholder.png'
  const displayName = profile?.name || company.name
  const displayPhone = profile?.phone || company.primaryPhone
  const displayEmail = profile?.email || company.email
  const displayAddress = profile?.address || company.address
  const displayBio = profile?.bio || company.description

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* 프로필 기본 정보 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{displayName}</h2>
              <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                <span className="flex items-center gap-1">
                  <FaPhone className="text-blue-600" />
                  {formatPhoneNumber(displayPhone)}
                </span>
                {displayEmail && (
                  <span className="flex items-center gap-1">
                    <FaEnvelope className="text-blue-600" />
                    {displayEmail}
                  </span>
                )}
                {displayAddress && (
                  <span className="flex items-center gap-1">
                    <FaMapMarkerAlt className="text-blue-600" />
                    {displayAddress}
                  </span>
                )}
              </div>
              {displayBio && (
                <p className="mt-2 text-gray-600">{displayBio}</p>
              )}
            </div>
          </div>
        </div>

        {/* 크레딧 정보 */}
        {creditBalanceResponse?.data && (
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <IoCash className="text-2xl" />
                  <h2 className="text-lg font-semibold">크레딧 잔액</h2>
                </div>
                <p className="text-3xl font-bold mb-1">{creditBalanceResponse.data.balance.toLocaleString()} 원</p>
                <p className="text-sm opacity-90">다양한 서비스 이용이 가능합니다</p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => router.push('/mypage/credits/purchase')}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm"
                >
                  충전하기
                </button>
                <button
                  onClick={() => router.push('/mypage/credits/transactions')}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  내역 보기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 업체 상세 정보 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          {/* 커버 이미지 */}
          <div className="relative w-full h-64 bg-gray-200">
            <Image
              src={primaryImage}
              alt={company.name}
              fill
              className="object-cover"
            />
          </div>

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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-gray-200">
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
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(company.detailContent) }}
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

            {/* 필터 그룹 */}
            {company.filterGroups && company.filterGroups.length > 0 && (
              <>
                {company.filterGroups.map((filterGroup) => (
                  <div key={filterGroup.categoryId} className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">{filterGroup.categoryName}</h2>
                    {filterGroup.categoryDescription && (
                      <p className="text-sm text-gray-600 mb-3">{filterGroup.categoryDescription}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {filterGroup.options.map((option) => (
                        <span
                          key={option.id}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                        >
                          {option.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* 태그 */}
            {company.tags && company.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">태그</h2>
                <div className="flex flex-wrap gap-2">
                  {company.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm"
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
                    <p className="font-semibold text-gray-900">{formatPhoneNumber(company.primaryPhone)}</p>
                  </div>
                </div>
                {company.secondaryPhone && (
                  <div className="flex items-start gap-3">
                    <FaPhone className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">보조 전화</p>
                      <p className="font-semibold text-gray-900">{formatPhoneNumber(company.secondaryPhone)}</p>
                    </div>
                  </div>
                )}
                {company.emergencyContact && (
                  <div className="flex items-start gap-3">
                    <FaPhone className="text-red-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">긴급 연락처</p>
                      <p className="font-semibold text-gray-900">{formatPhoneNumber(company.emergencyContact)}</p>
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
                    {(company.socialLinks as Record<string, string>).blog && (
                      <a
                        href={(company.socialLinks as Record<string, string>).blog}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm"
                      >
                        <SiNaver />
                        <span>블로그</span>
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
                    const businessHours = company.businessHours as Record<string, string>

                    return DAY_ORDER
                      .filter(day => businessHours[day])
                      .map(day => (
                        <div key={day} className="flex justify-between text-sm">
                          <span className="text-gray-600">{DAY_MAP[day]}</span>
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

            {/* 계정 설정 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">계정 설정</h2>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/mypage/company-profile-edit')}
                  className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  업체 기본 정보 수정
                </button>
                <button
                  onClick={() => router.push('/mypage/company-register')}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  업체 상세정보 수정
                </button>
                <button
                  onClick={() => router.push('/mypage/promoted-galleries')}
                  className="w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <FaAward />
                  내 우대 갤러리
                </button>
                <button
                  onClick={() => router.push('/inquiries/my')}
                  className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                >
                  내 문의 내역
                </button>
                <button
                  onClick={() => router.push('/mypage/password-change')}
                  className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                >
                  비밀번호 변경
                </button>

                {/* 구분선 */}
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <button
                    onClick={handleDeleteCompany}
                    disabled={isDeleting}
                    className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    {isDeleting ? '삭제 중...' : '업체 삭제'}
                  </button>
                  <p className="text-xs text-red-600 mt-2 text-center">
                    ⚠️ 삭제된 업체는 복구할 수 없습니다
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
