import { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ProposalDetailClientWrapper from '@/components/proposal/ProposalDetailClientWrapper'

interface ProposalDetailPageProps {
  params: Promise<{
    uuid: string
  }>
}

export const metadata: Metadata = {
  title: '제안 상세 - 다모아',
  description: '견적 제안 상세 정보',
}

export default async function ProposalDetailPage({ params }: ProposalDetailPageProps) {
  const { uuid } = await params

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <ProposalDetailClientWrapper uuid={uuid} />
        </div>
      </div>
      <Footer />
    </>
  )
}
