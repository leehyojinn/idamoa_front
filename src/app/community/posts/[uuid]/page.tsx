import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CommunityPostDetailClient from '@/components/community/CommunityPostDetailClient'
import { getCommunityPost } from '@/lib/api/community'

interface PageProps {
  params: Promise<{ uuid: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { uuid } = await params
    const result = await getCommunityPost(uuid)

    if (!result.success || !result.data) {
      return { title: '게시글을 찾을 수 없습니다' }
    }

    const post = result.data
    const canonicalUrl = `https://h-damoa.com/community/posts/${uuid}`

    return {
      title: `${post.title} | 커뮤니티 | 병원 인테리어 다모아`,
      description: post.content?.substring(0, 160).replace(/<[^>]*>/g, '') || '커뮤니티 게시글',
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: post.title,
        description: post.content?.substring(0, 160).replace(/<[^>]*>/g, ''),
        url: canonicalUrl,
        type: 'article',
      },
    }
  } catch {
    return { title: '게시글을 찾을 수 없습니다' }
  }
}

export default async function CommunityPostDetailPage({ params }: PageProps) {
  const { uuid } = await params

  let post = null
  try {
    const result = await getCommunityPost(uuid)
    if (result.success && result.data) {
      post = result.data
    }
  } catch (error) {
    console.error('게시글 로드 실패:', error)
  }

  if (!post) {
    notFound()
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-6 md:py-8">
        <div className="max-w-4xl mx-auto px-4">
          <CommunityPostDetailClient uuid={uuid} initialData={post} />
        </div>
      </main>
      <Footer />
    </>
  )
}
