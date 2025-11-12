import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createPageMetadata } from '@/lib/metadata'
import HeroSlide from '@/components/layout/slide/HeroSlide'

export const metadata = createPageMetadata({
  title: '홈',
  description: '병원, 의원, 치과, 한의원 등 의료기관 인테리어 전문 업체들을 한곳에서 확인하세요. 사진, 견적, AI 추천까지 인테리어의 모든 것.',
  path: '/',
  keywords: ['홈', '메인', '의료기관', '병원'],
})

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSlide/>
      </main>
      <Footer />
    </div>
  )
}
