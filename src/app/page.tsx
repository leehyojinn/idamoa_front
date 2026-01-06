import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createPageMetadata } from '@/lib/metadata'
import PopupManager from '@/components/popup/PopupManager'
import PortfolioListClient from '@/components/portfolio/PortfolioListClient'
import FeaturedPortfolios from '@/components/portfolio/FeaturedPortfolios'
import FeaturedPartnerships from '@/components/partnership/FeaturedPartnerships'
import { searchPortfolios } from '@/lib/api/portfolio'
import { OrganizationSchema, WebSiteSchema } from '@/components/seo/JsonLd'

export const metadata = createPageMetadata({
  title: '인테리어 다모아 - 인테리어 전문 플랫폼',
  description: '다양한 인테리어 전문 업체들을 한곳에서 확인하세요. 사진, 견적, AI 추천까지 인테리어의 모든 것.',
  path: '/',
  keywords: ['홈','인테리어', '메인', '리모델링', '집꾸미기', '인테리어 사진'],
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
      <Navbar />

      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary to-indigo-900">
        {/* 배경 장식 요소 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-800/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            {/* 뱃지 */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm text-primary-100">지금 바로 시작하세요</span>
            </div>

            {/* 메인 타이틀 */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
              인테리어,<br className="md:hidden" />
              <span className="bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 bg-clip-text text-transparent"> 다 모아 </span>
            </h1>

            {/* 서브 타이틀 */}
            <p className="text-xl md:text-2xl text-primary-100/90 max-w-3xl mx-auto mb-10 leading-relaxed">
              <span className="font-semibold text-white">모든 인테리어를</span>한 곳에서, 다 모아놓은 원스톱 플랫폼
            </p>

            {/* CTA 버튼 */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="#portfolio"
                className="group inline-flex items-center justify-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-white/25 hover:shadow-white/40 hover:scale-105 transition-all duration-300"
              >
                포트폴리오 둘러보기
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 제휴 업체 슬라이드 */}
      <FeaturedPartnerships count={8} />

      {/* 추천 포트폴리오 슬라이드 */}
      <FeaturedPortfolios count={8} />

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
      <PopupManager />
    </div>
  )
}
