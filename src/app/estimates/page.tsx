import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import EstimatesListClient from '@/components/estimate/EstimatesListClient'
import { getEstimateRequests } from '@/lib/api/estimate'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '견적 요청 | 다모아',
  description: '시공 견적 요청을 확인하고 제안서를 제출하세요',
}

export default async function EstimatesPage() {
  // SSR: 서버에서 초기 데이터 로드 (SEO 최적화)
  let initialData = null
  try {
    const result = await getEstimateRequests(0, 20, 'createdAt,desc')
    initialData = result.data
  } catch (error) {
    console.error('견적 초기 로드 실패:', error)
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">견적 요청</h1>
            <p className="text-xl text-blue-100">
              시공 견적 요청을 확인하고 최적의 제안서를 제출하세요
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <EstimatesListClient initialData={initialData || undefined} />
        </div>
      </main>
      <Footer />
    </>
  )
}
