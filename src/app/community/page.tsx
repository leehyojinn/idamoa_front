import { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CommunityListClient from '@/components/community/CommunityListClient'
import { getCommunityCategories, getCommunityPosts } from '@/lib/api/community'
import { createPageMetadata } from '@/lib/metadata'

export const metadata: Metadata = createPageMetadata({
  title: '커뮤니티',
  description: '인테리어에 관한 다양한 이야기를 나눠보세요. 자유롭게 질문하고 정보를 공유하세요.',
  path: '/community',
  keywords: ['인테리어 커뮤니티', '인테리어 질문', '시공 후기', '인테리어 정보'],
})

export const dynamic = 'force-dynamic'

export default async function CommunityPage() {
  // 초기 데이터 로드
  let initialCategories = null
  let initialPosts = null

  try {
    const [categoriesResult, postsResult] = await Promise.all([
      getCommunityCategories(),
      getCommunityPosts({ page: 0, size: 20, sort: 'createdAt,desc' }),
    ])

    if (categoriesResult.success) {
      initialCategories = categoriesResult.data
    }
    if (postsResult.success) {
      initialPosts = postsResult.data
      // 각 게시글의 카테고리 정보 로그
      console.log('[Community All] posts:', initialPosts?.content?.map(p => ({
        title: p.title,
        categoryName: p.categoryName,
        categorySlug: p.categorySlug
      })))
    }
  } catch (error) {
    console.error('커뮤니티 데이터 로드 실패:', error)
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary to-indigo-700 text-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">커뮤니티</h1>
            <p className="text-lg md:text-xl text-blue-100">
              인테리어에 관한 다양한 이야기를 나눠보세요
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
          <CommunityListClient
            initialCategories={initialCategories || undefined}
            initialPosts={initialPosts || undefined}
            categorySlug=""
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
