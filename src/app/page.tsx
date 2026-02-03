import { Suspense } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createPageMetadata } from '@/lib/metadata'
import PopupManager from '@/components/popup/PopupManager'
import OnboardingHandler from '@/components/onboarding/OnboardingHandler'
import PortfolioListClient from '@/components/portfolio/PortfolioListClient'
import FeaturedPartnerships from '@/components/partnership/FeaturedPartnerships'
import { searchPortfolios } from '@/lib/api/portfolio'
import { OrganizationSchema, WebSiteSchema, FAQSchema, ServiceSchema } from '@/components/seo/JsonLd'

// 메인 페이지 FAQ 데이터 (검색 결과에 리치 스니펫으로 표시됨)
const mainPageFAQ = [
  {
    question: '인테리어 비용은 평균 얼마인가요?',
    answer: '인테리어 비용은 평수, 시공 범위, 자재에 따라 다릅니다. 일반적으로 20평 아파트 기준 부분 인테리어는 500~1,500만원, 전체 인테리어는 2,000~5,000만원 정도입니다. 다모아에서 무료 견적을 받아 정확한 비용을 확인하세요.',
  },
  {
    question: '인테리어 업체는 어떻게 선택해야 하나요?',
    answer: '인테리어 업체 선택 시 1) 포트폴리오 확인 2) 실제 시공 사례 및 후기 확인 3) 여러 업체 견적 비교 4) 계약서 꼼꼼히 확인이 중요합니다. 다모아에서는 검증된 전문 업체들의 포트폴리오와 리뷰를 한눈에 비교할 수 있습니다.',
  },
  {
    question: '인테리어 견적은 무료인가요?',
    answer: '네, 다모아에서 인테리어 견적 요청은 완전 무료입니다. 원하는 조건을 입력하시면 여러 인테리어 업체로부터 견적을 받아보실 수 있으며, 견적 비교 후 마음에 드는 업체를 선택하시면 됩니다.',
  },
  {
    question: '인테리어 기간은 얼마나 걸리나요?',
    answer: '인테리어 기간은 시공 범위에 따라 다릅니다. 부분 인테리어(도배, 장판)는 1~3일, 욕실/주방 리모델링은 1~2주, 전체 인테리어는 3~8주 정도 소요됩니다. 정확한 기간은 업체 상담을 통해 확인하세요.',
  },
]

export const metadata = createPageMetadata({
  title: '인테리어 업체 비교 & 무료 견적 | 인테리어 다모아',
  description: '인테리어 업체 비교부터 무료 견적까지! 아파트, 주택, 상가 인테리어 전문 업체 포트폴리오를 확인하고 내 집에 딱 맞는 업체를 찾아보세요. 전국 인테리어 시공 사례와 실시간 견적 비교.',
  path: '/',
  keywords: ['인테리어', '인테리어 업체', '인테리어 견적', '인테리어 비용', '인테리어 업체 추천', '리모델링', '아파트 인테리어', '인테리어 비교', '무료 견적'],
})

export default async function Home() {
  // SSR: 서버에서 초기 데이터 로드 (SEO 최적화)
  let initialData = null
  try {
    const result = await searchPortfolios({
      page: 0,
      size: 12,
      sort: 'createdAt,DESC',
    })
    initialData = result.data
  } catch (error) {
    console.error('포트폴리오 초기 로드 실패:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <OrganizationSchema />
      <WebSiteSchema />
      <FAQSchema items={mainPageFAQ} />
      <ServiceSchema
        name="인테리어 업체 비교 서비스"
        description="전국 인테리어 전문 업체 포트폴리오 비교, 무료 견적 요청, 시공 사례 확인까지 인테리어의 모든 것을 한 곳에서 해결하세요."
      />
      <Navbar />

      {/* 히어로 섹션 - 포트폴리오 등록 유도 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary to-indigo-900">
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-800/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm text-primary-100">무료로 등록하세요</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
              시공 사례를 등록하고<br />
              <span className="bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 bg-clip-text text-transparent">더 많은 고객을 만나세요</span>
            </h1>

            <p className="text-lg md:text-xl text-primary-100/90 max-w-2xl mx-auto mb-8 leading-relaxed">
              포트폴리오 하나로 <span className="font-semibold text-white">수많은 고객에게 어필</span>할 수 있습니다
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/portfolios/create"
                className="group inline-flex items-center justify-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-white/25 hover:shadow-white/40 hover:scale-105 transition-all duration-300"
              >
                포트폴리오 등록하기
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </Link>
              <Link
                href="/community"
                className="group inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 hover:scale-105 transition-all duration-300"
              >
                커뮤니티
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 제휴 업체 슬라이드 - 숨김 처리
      <FeaturedPartnerships count={8} />
      */}

      <main id="portfolio" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Suspense fallback={
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary"></div>
          </div>
        }>
          <PortfolioListClient initialData={initialData || undefined} />
        </Suspense>
      </main>
      <Footer />
      <OnboardingHandler />
      <PopupManager />
    </div>
  )
}
