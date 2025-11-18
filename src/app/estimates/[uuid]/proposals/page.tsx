import { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import EstimateProposalsClient from '@/components/proposal/EstimateProposalsClient'

interface EstimateProposalsPageProps {
  params: Promise<{
    uuid: string
  }>
}

export const metadata: Metadata = {
  title: '제안서 목록 - 다모아',
  description: '견적 요청에 제출된 제안서 목록',
}

export default async function EstimateProposalsPage({ params }: EstimateProposalsPageProps) {
  const { uuid } = await params

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <EstimateProposalsClient requestUuid={uuid} />
        </div>
      </div>
      <Footer />
    </>
  )
}
