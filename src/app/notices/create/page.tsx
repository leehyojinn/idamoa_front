import { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import NoticeCreateClient from '@/components/notice/NoticeCreateClient'

export const metadata: Metadata = {
  title: '공지사항/이벤트 작성 | 다모아',
  description: '공지사항 또는 이벤트를 작성합니다',
}

export default function NoticeCreatePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <NoticeCreateClient />
        </div>
      </main>
      <Footer />
    </div>
  )
}
