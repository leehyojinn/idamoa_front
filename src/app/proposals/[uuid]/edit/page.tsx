import { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ProposalEditClientWrapper from '@/components/proposal/ProposalEditClientWrapper'

interface ProposalEditPageProps {
  params: Promise<{
    uuid: string
  }>
}

export const metadata: Metadata = {
  title: '제안서 수정 - 다모아',
  description: '제안서 수정',
}

export default async function ProposalEditPage({ params }: ProposalEditPageProps) {
  const { uuid } = await params

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <ProposalEditClientWrapper uuid={uuid} />
        </div>
      </div>
      <Footer />
    </>
  )
}
