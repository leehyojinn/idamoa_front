import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import EstimateEditForm from '@/components/estimate/EstimateEditForm'
import { getEstimateRequest } from '@/lib/api/estimate'

interface PageProps {
  params: Promise<{
    uuid: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { uuid } = await params
    const result = await getEstimateRequest(uuid)

    if (!result.success || !result.data) {
      return {
        title: '견적 요청을 찾을 수 없습니다 | 다모아',
      }
    }

    const estimate = result.data

    return {
      title: `${estimate.title} 수정 | 견적 요청 | 다모아`,
      description: '견적 요청을 수정합니다',
    }
  } catch {
    return {
      title: '견적 요청을 찾을 수 없습니다 | 다모아',
    }
  }
}

export default async function EstimateEditPage({ params }: PageProps) {
  const { uuid } = await params
  const result = await getEstimateRequest(uuid)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">견적 요청 수정</h1>
            <p className="text-xl text-blue-100">
              견적 요청 정보를 수정하세요
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <EstimateEditForm estimate={result.data} />
        </div>
      </main>
      <Footer />
    </>
  )
}
