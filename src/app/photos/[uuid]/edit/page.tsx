import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import GalleryEditFormWrapper from '@/components/gallery/GalleryEditFormWrapper'

interface PageProps {
  params: Promise<{ uuid: string }>
}

export default async function GalleryEditPage({ params }: PageProps) {
  const { uuid } = await params

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary"></div>
          </div>
        }>
          <GalleryEditFormWrapper uuid={uuid} />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
