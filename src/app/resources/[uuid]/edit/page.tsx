import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import DocumentEditForm from '@/components/resource/DocumentEditForm'

interface PageProps {
  params: Promise<{ uuid: string }>
}

export default async function DocumentEditPage({ params }: PageProps) {
  const { uuid } = await params

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Suspense fallback={
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary"></div>
          </div>
        }>
          <DocumentEditForm uuid={uuid} />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
