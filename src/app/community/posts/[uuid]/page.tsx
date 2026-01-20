import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CommunityPostDetailClient from '@/components/community/CommunityPostDetailClient'
import { getCommunityPost } from '@/lib/api/community'
import { DiscussionPostSchema, BreadcrumbSchema } from '@/components/seo/JsonLd'

// React cache를 사용하여 같은 요청 내에서 API 호출 중복 제거 (조회수 중복 증가 방지)
const getCachedPost = cache(async (uuid: string) => {
  return getCommunityPost(uuid)
})

interface PageProps {
  params: Promise<{ uuid: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { uuid } = await params
    const result = await getCachedPost(uuid)

    if (!result.success || !result.data) {
      return { title: '게시글을 찾을 수 없습니다' }
    }

    const post = result.data
    const canonicalUrl = `https://h-damoa.com/community/posts/${uuid}`

    return {
      title: `${post.title} | 커뮤니티 | 인테리어 다모아`,
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
    const result = await getCachedPost(uuid)
    if (result.success && result.data) {
      post = result.data
    }
  } catch (error) {
    console.error('게시글 로드 실패:', error)
  }

  if (!post) {
    notFound()
  }

  const postUrl = `https://i-damoa.com/community/posts/${uuid}`

  return (
    <>
      {/* SEO 구조화 데이터 */}
      <DiscussionPostSchema
        title={post.title}
        content={post.content?.replace(/<[^>]*>/g, '') || ''}
        url={postUrl}
        authorName={post.authorName || '익명'}
        datePublished={post.createdAt}
        dateModified={post.updatedAt}
        commentCount={post.commentCount}
        likeCount={post.likeCount}
        image={post.attachments?.find(a => a.attachmentType === 'IMAGE')?.fileUrl}
      />
      <BreadcrumbSchema
        items={[
          { name: '홈', url: 'https://i-damoa.com' },
          { name: '커뮤니티', url: 'https://i-damoa.com/community' },
          { name: post.categoryName || '게시판', url: `https://i-damoa.com/community/${post.categorySlug || ''}` },
          { name: post.title, url: postUrl },
        ]}
      />
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
