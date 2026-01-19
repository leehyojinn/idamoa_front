import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { cache } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import EstimateDetailClient from '@/components/estimate/EstimateDetailClient'
import { getEstimateRequest } from '@/lib/api/estimate'

// React cache를 사용하여 같은 요청 내에서 API 호출 중복 제거 (조회수 중복 증가 방지)
const getCachedEstimate = cache(async (uuid: string) => {
  return getEstimateRequest(uuid)
})

interface PageProps {
  params: Promise<{
    uuid: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { uuid } = await params
    const result = await getCachedEstimate(uuid)

    if (!result.success || !result.data) {
      return {
        title: '견적 요청을 찾을 수 없습니다 | 다모아',
      }
    }

    const estimate = result.data
    const canonicalUrl = `https://i-damoa.com/estimates/${uuid}`

    return {
      title: `${estimate.title} | 견적 요청 | 다모아`,
      description: estimate.description,
      alternates: {
        canonical: canonicalUrl,
      },
    }
  } catch {
    return {
      title: '견적 요청을 찾을 수 없습니다 | 다모아',
    }
  }
}

export default async function EstimateDetailPage({ params }: PageProps) {
  const { uuid } = await params
  const result = await getCachedEstimate(uuid)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <>
      <Navbar />
      <EstimateDetailClient estimate={result.data} />
      <Footer />
    </>
  )
}
