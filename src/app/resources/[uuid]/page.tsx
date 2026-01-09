import { redirect } from 'next/navigation'

// 자료실 상세 페이지 숨김 처리 - 메인으로 리다이렉트
export default function DocumentDetailPage() {
  redirect('/')
}

/* 원래 코드 - 나중에 복원 시 주석 해제
import { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import DocumentDetailClient from '@/components/resource/DocumentDetailClient'
import { getDocument } from '@/lib/api/resource'
import { ArticleSchema, BreadcrumbSchema } from '@/components/seo/JsonLd'

interface PageProps {
  params: Promise<{ uuid: string }>
}

// SEO 메타데이터 생성
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { uuid } = await params
    const result = await getDocument(uuid)

    if (!result.success || !result.data) {
      return { title: '자료를 찾을 수 없습니다' }
    }

    const document = result.data
    const primaryImage = document.thumbnail?.fileUrl || '/images/img-placeholder.png'
    const canonicalUrl = `https://i-damoa.com/resources/${uuid}`

    return {
      title: `${document.title} - 자료실 | 다모아`,
      description: document.content || `${document.title} - 인테리어 자료실`,
      keywords: document.tags?.join(', '),
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: document.title,
        description: document.content || undefined,
        url: canonicalUrl,
        images: [{ url: primaryImage, width: 1200, height: 630, alt: document.title }],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: document.title,
        description: document.content || undefined,
        images: [primaryImage],
      },
    }
  } catch {
    return { title: '자료를 찾을 수 없습니다' }
  }
}

export default async function DocumentDetailPageOriginal({ params }: PageProps) {
  const { uuid } = await params

  // SSR: 서버에서 초기 데이터 로드
  let result
  try {
    result = await getDocument(uuid)
  } catch (error) {
    console.error('자료 상세 로드 실패:', error)
    notFound()
  }

  if (!result?.success || !result?.data) {
    notFound()
  }

  const document = result.data
  const resourceUrl = `https://i-damoa.com/resources/${uuid}`

  return (
    <div className="min-h-screen bg-gray-50">
      <ArticleSchema
        title={document.title}
        description={document.content}
        url={resourceUrl}
        image={document.thumbnail?.fileUrl}
        datePublished={document.createdAt}
        dateModified={document.updatedAt}
      />
      <BreadcrumbSchema
        items={[
          { name: '홈', url: 'https://i-damoa.com' },
          { name: '자료실', url: 'https://i-damoa.com/resources' },
          { name: document.title, url: resourceUrl },
        ]}
      />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary"></div>
          </div>
        }>
          <DocumentDetailClient uuid={uuid} initialData={result.data} />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
*/
