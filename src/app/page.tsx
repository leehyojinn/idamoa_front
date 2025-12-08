import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createPageMetadata } from '@/lib/metadata'
import CompanySection from '@/components/company/CompanySection'
import HeroSlide from '@/components/layout/slide/HeroSlide'
import PopupManager from '@/components/popup/PopupManager'
import EstimateSlideSection from '@/components/estimate/EstimateSlideSection'
import { getCompanies } from '@/lib/api/company'

export const metadata = createPageMetadata({
  title: '인테리어 다모아 - 인테리어 전문 플랫폼',
  description: '다양한 인테리어 전문 업체들을 한곳에서 확인하세요. 사진, 견적, AI 추천까지 인테리어의 모든 것.',
  path: '/',
  keywords: ['홈','인테리어', '메인', '리모델링', '집꾸미기'],
})

export default async function Home() {
  // SSR: 서버에서 초기 데이터 로드 (SEO 최적화)
  const initialData = await getCompanies({ page: 0, size: 12, sort: 'createdAt,DESC' })

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSlide />
        <CompanySection initialData={initialData.data} />
        <EstimateSlideSection />
      </main>
      <Footer />
      <PopupManager />
    </div>
  )
}
