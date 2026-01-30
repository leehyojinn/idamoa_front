import { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CommunityGridView from '@/components/community/CommunityGridView'
import { getCommunityCategories } from '@/lib/api/community'
import { createPageMetadata } from '@/lib/metadata'

export const metadata: Metadata = createPageMetadata({
  title: '커뮤니티',
  description: '인테리어에 관한 다양한 이야기를 나눠보세요. 자유롭게 질문하고 정보를 공유하세요.',
  path: '/community',
  keywords: ['인테리어 커뮤니티', '인테리어 질문', '시공 후기', '인테리어 정보'],
})

export const dynamic = 'force-dynamic'

export default async function CommunityPage() {
  // 카테고리 데이터 로드
  let initialCategories = null

  try {
    const categoriesResult = await getCommunityCategories()
    if (categoriesResult.success) {
      initialCategories = categoriesResult.data
    }
  } catch (error) {
    console.error('커뮤니티 카테고리 로드 실패:', error)
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary to-indigo-700 text-white py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">커뮤니티</h1>
            <p className="text-base md:text-xl text-blue-100">
              인테리어에 관한 다양한 이야기를 나눠보세요
            </p>
          </div>
        </div>

        {/* Main Content - Grid View */}
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
          <CommunityGridView initialCategories={initialCategories || undefined} />
        </div>
      </main>
      <Footer />
    </>
  )
}
