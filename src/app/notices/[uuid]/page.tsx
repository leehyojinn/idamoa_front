import { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import NoticeDetailClient from '@/components/notice/NoticeDetailClient'

export const metadata: Metadata = {
  title: '공지사항 상세 | 다모아',
  description: '공지사항 및 이벤트 상세 내용을 확인하세요',
}

interface NoticeDetailPageProps {
  params: Promise<{
    uuid: string
  }>
}

export default async function NoticeDetailPage({ params }: NoticeDetailPageProps) {
  const { uuid } = await params

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <NoticeDetailClient uuid={uuid} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
