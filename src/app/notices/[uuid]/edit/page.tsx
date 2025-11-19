import { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import NoticeEditClient from '@/components/notice/NoticeEditClient'

export const metadata: Metadata = {
  title: '공지사항/이벤트 수정 | 다모아',
  description: '공지사항 또는 이벤트를 수정합니다',
}

interface NoticeEditPageProps {
  params: {
    uuid: string
  }
}

export default function NoticeEditPage({ params }: NoticeEditPageProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <NoticeEditClient uuid={params.uuid} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
