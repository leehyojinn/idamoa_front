import { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import NoticeDetailClient from '@/components/notice/NoticeDetailClient'
import { getNoticeEvent } from '@/lib/api/notice-event'
import { ArticleSchema, BreadcrumbSchema } from '@/components/seo/JsonLd'

interface NoticeDetailPageProps {
  params: Promise<{
    uuid: string
  }>
}

export async function generateMetadata({ params }: NoticeDetailPageProps): Promise<Metadata> {
  try {
    const { uuid } = await params
    const result = await getNoticeEvent(uuid)

    if (!result.success || !result.data) {
      return {
        title: '공지사항을 찾을 수 없습니다',
      }
    }

    const notice = result.data
    const description = notice.content?.substring(0, 160) || notice.title
    return {
      title: `${notice.title} | 다모아`,
      description,
      openGraph: {
        title: notice.title,
        description,
        type: 'article',
        publishedTime: notice.publishedAt,
        images: notice.thumbnail?.fileUrl ? [{ url: notice.thumbnail.fileUrl }] : [],
      },
    }
  } catch {
    return {
      title: '공지사항 상세 | 다모아',
    }
  }
}

export default async function NoticeDetailPage({ params }: NoticeDetailPageProps) {
  const { uuid } = await params

  let notice = null
  try {
    const result = await getNoticeEvent(uuid)
    if (result.success && result.data) {
      notice = result.data
    }
  } catch {
    // 에러 시 클라이언트에서 처리
  }

  const noticeUrl = `https://i-damoa.com/notices/${uuid}`

  return (
    <div className="min-h-screen flex flex-col">
      {notice && (
        <>
          <ArticleSchema
            title={notice.title}
            description={notice.content?.substring(0, 160)}
            url={noticeUrl}
            image={notice.thumbnail?.fileUrl}
            datePublished={notice.publishedAt || notice.createdAt}
            dateModified={notice.updatedAt}
          />
          <BreadcrumbSchema
            items={[
              { name: '홈', url: 'https://i-damoa.com' },
              { name: '공지/이벤트', url: 'https://i-damoa.com/notices' },
              { name: notice.title, url: noticeUrl },
            ]}
          />
        </>
      )}
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
