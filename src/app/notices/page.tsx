import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import NoticeListClient from '@/components/notice/NoticeListClient'
import { createPageMetadata } from '@/lib/metadata'

export const metadata = createPageMetadata({
  title: '공지사항 & 이벤트',
  description: '다모아의 공지사항 및 이벤트를 확인하세요',
  path: '/notices',
})

export default function NoticesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <NoticeListClient />
        </div>
      </main>
      <Footer />
    </div>
  )
}
