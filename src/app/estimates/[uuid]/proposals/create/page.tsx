import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ProposalCreateForm from '@/components/proposal/ProposalCreateForm'
import { getEstimateRequest } from '@/lib/api/estimate'

interface ProposalCreatePageProps {
  params: Promise<{
    uuid: string
  }>
}

export const metadata: Metadata = {
  title: '제안서 작성 - 다모아',
  description: '견적 요청에 대한 제안서 작성',
}

export default async function ProposalCreatePage({ params }: ProposalCreatePageProps) {
  const { uuid } = await params

  try {
    const result = await getEstimateRequest(uuid)

    if (!result.success || !result.data) {
      notFound()
    }

    const estimate = result.data

    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <ProposalCreateForm requestUuid={estimate.uuid} requestTitle={estimate.title} />
          </div>
        </div>
        <Footer />
      </>
    )
  } catch (error) {
    console.error('Failed to fetch estimate request:', error)
    notFound()
  }
}
