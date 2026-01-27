'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FaStar,
  FaHeart,
  FaEye,
  FaComment,
  FaBell,
  FaWallet,
  FaImages,
  FaFileAlt,
  FaChartLine,
  FaClock,
  FaFileInvoiceDollar,
} from 'react-icons/fa'
import { IoChatbubbles, IoCash } from 'react-icons/io5'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuthStore } from '@/stores/authStore'
import { useMyCompany } from '@/hooks/useCompany'
import {
  useMyPortfoliosDashboard,
  useMyProposalsDashboard,
  useCompanyPortfolioConsultationsDashboard,
  useCompanyReviewsDashboard,
  useCreditBalanceDashboard,
  useUnreadNotificationCount,
  useUnreadChatCount,
} from '@/hooks/useCompanyDashboard'
import { CONSULTATION_STATUS_LABELS, CONSULTATION_STATUS_COLORS } from '@/types/portfolio-consultation'
import { showErrorToast } from '@/lib/errorHandler'

// ========================================
// Stat Card Component
// ========================================

function StatCard({
  label,
  value,
  icon: Icon,
  color = 'primary',
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color?: 'primary' | 'yellow' | 'red' | 'green' | 'blue' | 'purple'
}) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600">{label}</p>
        </div>
      </div>
    </div>
  )
}

// ========================================
// Main Component
// ========================================

export default function CompanyDashboardPage() {
  const router = useRouter()
  const { accessToken, _hasHydrated } = useAuthStore()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // 내 업체 정보
  const { data: companyResponse, isLoading: companyLoading } = useMyCompany()
  const company = companyResponse?.data

  // 대시보드 데이터
  const { data: portfoliosResponse } = useMyPortfoliosDashboard(0, 5)
  const { data: proposalsResponse } = useMyProposalsDashboard(0, 5)
  const { data: reviewsResponse } = useCompanyReviewsDashboard(company?.uuid || '', 0, 5)
  const { data: portfolioConsultationsResponse } = useCompanyPortfolioConsultationsDashboard(
    company?.uuid || '',
    'PENDING',
    0,
    5
  )
  const { data: creditBalanceResponse } = useCreditBalanceDashboard()
  const { data: notificationUnreadResponse } = useUnreadNotificationCount()
  const { data: chatUnreadResponse } = useUnreadChatCount()

  // 인증 체크
  useEffect(() => {
    if (!_hasHydrated) return

    if (!accessToken) {
      showErrorToast(null, '로그인이 필요한 페이지입니다')
      router.push('/login')
      return
    }
    setIsCheckingAuth(false)
  }, [router, accessToken, _hasHydrated])

  // 로딩 중
  if (isCheckingAuth || companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 업체 정보 없음
  if (!company) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">업체 정보가 없습니다</h2>
            <p className="text-gray-600 mb-6">업체 등록 후 대시보드를 이용할 수 있습니다</p>
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

  const creditBalance = creditBalanceResponse?.data?.balance || 0
  const unreadNotifications = notificationUnreadResponse?.unreadCount || 0
  const unreadChats = chatUnreadResponse?.data || 0
  const pendingPortfolioConsultations = portfolioConsultationsResponse?.data?.totalElements || 0
  const portfolios = portfoliosResponse?.data?.content || []
  const proposals = proposalsResponse?.data?.content || []
  const reviews = reviewsResponse?.data?.content || []
  const portfolioConsultations = portfolioConsultationsResponse?.data?.content || []

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">업체 대시보드</h1>
            <p className="text-gray-600 mt-1">{company.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* 크레딧 잔액 */}
            <Link
              href="/mypage/credits/transactions"
              className="flex items-center gap-2 bg-primary-50 text-primary px-4 py-2 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <IoCash className="w-5 h-5" />
              <span className="font-bold">{creditBalance.toLocaleString()}원</span>
            </Link>

            {/* 알림 */}
            <Link
              href="/mypage/company-dashboard/notifications"
              className="relative p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50"
            >
              <FaBell className="w-5 h-5 text-gray-600" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </Link>

            {/* 채팅 */}
            <Link
              href="/mypage/company-dashboard/chats"
              className="relative p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50"
            >
              <IoChatbubbles className="w-5 h-5 text-gray-600" />
              {unreadChats > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadChats > 99 ? '99+' : unreadChats}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            label="평균 평점"
            value={company.avgRating?.toFixed(1) || '0.0'}
            icon={FaStar}
            color="yellow"
          />
          <StatCard
            label="리뷰"
            value={company.reviewCount?.toLocaleString() || '0'}
            icon={FaComment}
            color="blue"
          />
          <StatCard
            label="조회수"
            value={company.viewCount?.toLocaleString() || '0'}
            icon={FaEye}
            color="green"
          />
          <StatCard
            label="좋아요"
            value={company.likeCount?.toLocaleString() || '0'}
            icon={FaHeart}
            color="red"
          />
          <StatCard
            label="포트폴리오"
            value={company.portfolioCount?.toLocaleString() || '0'}
            icon={FaImages}
            color="purple"
          />
        </div>

        {/* 대기 중 포트폴리오 견적상담 알림 */}
        {pendingPortfolioConsultations > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaFileInvoiceDollar className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">
                  대기 중인 포트폴리오 견적상담이 {pendingPortfolioConsultations}건 있습니다
                </span>
              </div>
              <Link
                href="/mypage/company-dashboard/portfolio-consultations"
                className="text-red-600 hover:text-red-700 font-medium text-sm"
              >
                바로가기 →
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 최근 포트폴리오 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FaImages className="text-purple-500" />
                최근 포트폴리오
              </h2>
              <Link href="/mypage/company-dashboard/portfolios" className="text-primary text-sm hover:underline">
                전체 보기
              </Link>
            </div>
            {portfolios.length > 0 ? (
              <div className="space-y-3">
                {portfolios.slice(0, 5).map((portfolio: any) => (
                  <Link
                    key={portfolio.uuid}
                    href={`/portfolios/${portfolio.uuid}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{portfolio.title}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <FaEye /> {portfolio.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaHeart /> {portfolio.likeCount}
                        </span>
                      </div>
                    </div>
                    {portfolio.promotion && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                        우대
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaImages className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>등록된 포트폴리오가 없습니다</p>
                <Link
                  href="/portfolios/create"
                  className="inline-block mt-3 text-primary hover:underline text-sm"
                >
                  포트폴리오 등록하기
                </Link>
              </div>
            )}
          </div>

          {/* 내 제안 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FaFileAlt className="text-blue-500" />
                내 제안
              </h2>
              <Link href="/mypage/company-dashboard/proposals" className="text-primary text-sm hover:underline">
                전체 보기
              </Link>
            </div>
            {proposals.length > 0 ? (
              <div className="space-y-3">
                {proposals.slice(0, 5).map((proposal: any) => (
                  <Link
                    key={proposal.uuid}
                    href={`/proposals/${proposal.uuid}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{proposal.title}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {proposal.requestTitle}
                      </p>
                    </div>
                    <div className="ml-3 flex flex-col items-end">
                      <span className="font-bold text-primary">
                        {proposal.price?.toLocaleString()}원
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          proposal.status === 'SELECTED'
                            ? 'bg-green-100 text-green-700'
                            : proposal.status === 'SUBMITTED'
                            ? 'bg-blue-100 text-blue-700'
                            : proposal.status === 'VIEWED'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {proposal.status === 'SELECTED'
                          ? '선정됨'
                          : proposal.status === 'SUBMITTED'
                          ? '제출됨'
                          : proposal.status === 'VIEWED'
                          ? '열람됨'
                          : proposal.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaFileAlt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>제출한 제안이 없습니다</p>
                <Link
                  href="/estimates"
                  className="inline-block mt-3 text-primary hover:underline text-sm"
                >
                  견적 요청 둘러보기
                </Link>
              </div>
            )}
          </div>

          {/* 포트폴리오 견적상담 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FaFileInvoiceDollar className="text-red-500" />
                포트폴리오 견적상담
              </h2>
              <Link href="/mypage/company-dashboard/portfolio-consultations" className="text-primary text-sm hover:underline">
                전체 보기
              </Link>
            </div>
            {portfolioConsultations.length > 0 ? (
              <div className="space-y-3">
                {portfolioConsultations.slice(0, 5).map((consultation: any) => (
                  <Link
                    key={consultation.uuid}
                    href={`/mypage/company-dashboard/portfolio-consultations/${consultation.uuid}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{consultation.title}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {consultation.portfolioTitle} • {consultation.name}
                      </p>
                    </div>
                    <div className="ml-3 flex flex-col items-end">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${CONSULTATION_STATUS_COLORS[consultation.status as keyof typeof CONSULTATION_STATUS_COLORS] || 'bg-gray-100 text-gray-700'}`}
                      >
                        {CONSULTATION_STATUS_LABELS[consultation.status as keyof typeof CONSULTATION_STATUS_LABELS] || consultation.status}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        {new Date(consultation.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaFileInvoiceDollar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>받은 견적상담이 없습니다</p>
              </div>
            )}
          </div>

          {/* 최근 리뷰 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FaStar className="text-yellow-500" />
                최근 리뷰
              </h2>
              <Link href="/mypage/company-dashboard/reviews" className="text-primary text-sm hover:underline">
                전체 보기
              </Link>
            </div>
            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.slice(0, 5).map((review: any) => (
                  <div
                    key={review.uuid}
                    className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{review.userName || '익명'}</span>
                      <div className="flex items-center gap-1 text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={`w-3 h-3 ${
                              i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{review.content}</p>
                    {!review.reply && (
                      <p className="text-xs text-orange-600 mt-2">답글 작성이 필요합니다</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaStar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>아직 리뷰가 없습니다</p>
              </div>
            )}
          </div>

          {/* 빠른 메뉴 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">빠른 메뉴</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/mypage"
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <FaChartLine className="w-5 h-5 text-primary" />
                <span className="font-medium text-gray-700">업체 정보</span>
              </Link>
              <Link
                href="/portfolios/create"
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <FaImages className="w-5 h-5 text-purple-500" />
                <span className="font-medium text-gray-700">포트폴리오 등록</span>
              </Link>
              <Link
                href="/mypage/credits/purchase"
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <FaWallet className="w-5 h-5 text-green-500" />
                <span className="font-medium text-gray-700">크레딧 충전</span>
              </Link>
              {/* 우대 포트폴리오 기능 숨김 처리
              <Link
                href="/mypage/promoted-portfolios"
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <FaClock className="w-5 h-5 text-yellow-500" />
                <span className="font-medium text-gray-700">우대 포트폴리오</span>
              </Link>
              */}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
