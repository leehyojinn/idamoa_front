import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CommunityPostFormClient from '@/components/community/CommunityPostFormClient'
import { getCommunityPost, getCommunityCategories } from '@/lib/api/community'
import { createPageMetadata } from '@/lib/metadata'

export const metadata: Metadata = createPageMetadata({
  title: '글 수정',
  description: '커뮤니티 글을 수정합니다',
  path: '/community/posts/edit',
  noIndex: true,
})

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ uuid: string }>
}

export default async function CommunityPostEditPage({ params }: PageProps) {
  const { uuid } = await params

  let post = null
  let categories = null

  try {
    const [postResult, categoriesResult] = await Promise.all([
      getCommunityPost(uuid),
      getCommunityCategories(),
    ])

    if (postResult.success && postResult.data) {
      post = postResult.data
    }
    if (categoriesResult.success && categoriesResult.data) {
      categories = categoriesResult.data
    }
  } catch (error) {
    console.error('데이터 로드 실패:', error)
  }

  if (!post) {
    notFound()
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-6 md:py-8">
        <div className="max-w-4xl mx-auto px-4">
          <CommunityPostFormClient
            categories={categories || []}
            initialData={post}
            isEdit
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
