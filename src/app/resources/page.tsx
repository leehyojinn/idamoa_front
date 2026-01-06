import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import DocumentListClient from '@/components/resource/DocumentListClient'
import { searchDocuments } from '@/lib/api/resource'

export default async function DocumentsPage() {
  // SSR: 서버에서 초기 데이터 로드 (SEO 최적화)
  let initialData = null
  try {
    const result = await searchDocuments({
      page: 0,
      size: 12,
      sortBy: 'publishedAt',
      sortDirection: 'DESC',
    })
    initialData = result.data
  } catch (error) {
    console.error('자료실 초기 로드 실패:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Suspense fallback={
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary"></div>
          </div>
        }>
          <DocumentListClient initialData={initialData || undefined} />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
