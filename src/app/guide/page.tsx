import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import GuideContent from '@/components/guide/GuideContent'
import { createPageMetadata } from '@/lib/metadata'

export const metadata = createPageMetadata({
  title: '이용가이드',
  description:
    '다모아 서비스 이용가이드입니다. 회원가입, 업체 찾기, 포트폴리오 탐색, 견적 요청, 상담 신청 등 모든 기능의 사용법을 안내해 드립니다.',
  path: '/guide',
  keywords: [
    '이용가이드',
    '사용법',
    '인테리어',
    '견적',
    '상담',
    '포트폴리오',
    '업체찾기',
  ],
})

export default function GuidePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar showQuickmenu={false} />
      <main className="flex-1 bg-gray-50">
        <GuideContent />
      </main>
      <Footer />
    </div>
  )
}
