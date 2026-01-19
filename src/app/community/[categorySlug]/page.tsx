import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CommunityListClient from '@/components/community/CommunityListClient'
import { getCommunityCategories, getCommunityPosts, type CommunityCategory } from '@/lib/api/community'

interface PageProps {
  params: Promise<{ categorySlug: string }>
}

// 계층 구조에서 slug로 카테고리 찾기
function findCategoryBySlug(categories: CommunityCategory[], slug: string): CommunityCategory | null {
  for (const cat of categories) {
    if (cat.slug === slug) return cat
    if (cat.children) {
      const found = findCategoryBySlug(cat.children, slug)
      if (found) return found
    }
  }
  return null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { categorySlug } = await params
    const categoriesResult = await getCommunityCategories()

    if (!categoriesResult.success || !categoriesResult.data) {
      return { title: '커뮤니티 | 병원 인테리어 다모아' }
    }

    const category = findCategoryBySlug(categoriesResult.data, categorySlug)
    if (!category) {
      return { title: '커뮤니티 | 병원 인테리어 다모아' }
    }

    const canonicalUrl = `https://h-damoa.com/community/${categorySlug}`

    return {
      title: `${category.name} | 커뮤니티 | 병원 인테리어 다모아`,
      description: category.description || `${category.name} - 병원 인테리어 커뮤니티`,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: `${category.name} | 커뮤니티`,
        description: category.description || `${category.name} - 병원 인테리어 커뮤니티`,
        url: canonicalUrl,
      },
    }
  } catch {
    return { title: '커뮤니티 | 병원 인테리어 다모아' }
  }
}

export const dynamic = 'force-dynamic'

export default async function CommunityCategoryPage({ params }: PageProps) {
  const { categorySlug } = await params

  // 카테고리 및 게시글 로드
  let categories = null
  let posts = null
  let currentCategory = null

  try {
    const [categoriesResult, postsResult] = await Promise.all([
      getCommunityCategories(),
      getCommunityPosts({ categorySlug, page: 0, size: 20, sort: 'createdAt,desc' }),
    ])

    console.log('[Community Page] categorySlug:', categorySlug)
    console.log('[Community Page] postsResult:', JSON.stringify(postsResult, null, 2))

    if (categoriesResult.success && categoriesResult.data) {
      categories = categoriesResult.data
      currentCategory = findCategoryBySlug(categories, categorySlug)
      console.log('[Community Page] currentCategory:', currentCategory?.name, currentCategory?.uuid)
    }
    if (postsResult.success) {
      posts = postsResult.data
      console.log('[Community Page] posts count:', posts?.content?.length || 0)
    }
  } catch (error) {
    console.error('커뮤니티 데이터 로드 실패:', error)
  }

  // 카테고리가 없으면 404
  if (!currentCategory) {
    notFound()
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary to-indigo-700 text-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">{currentCategory.name}</h1>
            <p className="text-lg md:text-xl text-blue-100">
              {currentCategory.description || '병원 인테리어에 관한 다양한 이야기를 나눠보세요'}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
          <CommunityListClient
            initialCategories={categories || undefined}
            initialPosts={posts || undefined}
            categorySlug={categorySlug}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
