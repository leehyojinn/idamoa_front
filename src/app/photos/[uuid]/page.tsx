import { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import GalleryDetailClient from '@/components/gallery/GalleryDetailClient'
import { getGallery } from '@/lib/api/gallery'

// React cache를 사용하여 같은 요청 내에서 API 호출 중복 제거 (조회수 중복 증가 방지)
const getCachedGallery = cache(async (uuid: string) => {
  return getGallery(uuid)
})

interface PageProps {
  params: Promise<{ uuid: string }>
}

// SEO 메타데이터 생성
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { uuid } = await params
    const result = await getCachedGallery(uuid)

    if (!result.success || !result.data) {
      return { title: '포트폴리오를 찾을 수 없습니다' }
    }

    const gallery = result.data
    const primaryImage = gallery.images?.[0]?.fileUrl || '/images/img-placeholder.png'

    return {
      title: `${gallery.title} - 포트폴리오 | 다모아`,
      description: gallery.content || `${gallery.title} - 인테리어 포트폴리오`,
      keywords: gallery.tags?.join(', '),
      openGraph: {
        title: gallery.title,
        description: gallery.content || undefined,
        images: [{ url: primaryImage, width: 1200, height: 630, alt: gallery.title }],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: gallery.title,
        description: gallery.content || undefined,
        images: [primaryImage],
      },
    }
  } catch {
    return { title: '포트폴리오를 찾을 수 없습니다' }
  }
}

export default async function GalleryDetailPage({ params }: PageProps) {
  const { uuid } = await params

  // SSR: 서버에서 초기 데이터 로드 (캐시된 함수 사용)
  const result = await getCachedGallery(uuid)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary"></div>
          </div>
        }>
          <GalleryDetailClient uuid={uuid} initialData={result.data} />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
