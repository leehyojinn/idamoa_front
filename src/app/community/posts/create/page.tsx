import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CommunityPostFormClient from '@/components/community/CommunityPostFormClient'
import { getCommunityCategories } from '@/lib/api/community'
import { createPageMetadata } from '@/lib/metadata'

export const metadata: Metadata = createPageMetadata({
  title: '글쓰기',
  description: '커뮤니티에 새 글을 작성합니다',
  path: '/community/posts/create',
  noIndex: true,
})

export const dynamic = 'force-dynamic'

export default async function CommunityPostCreatePage() {
  // 카테고리 목록 로드
  let categories = null
  try {
    const result = await getCommunityCategories()
    if (result.success && result.data) {
      categories = result.data
    }
  } catch (error) {
    console.error('카테고리 로드 실패:', error)
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-6 md:py-8">
        <div className="max-w-4xl mx-auto px-4">
          <CommunityPostFormClient categories={categories || []} />
        </div>
      </main>
      <Footer />
    </>
  )
}
