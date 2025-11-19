import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import GalleryCreateForm from '@/components/gallery/GalleryCreateForm'

export default function GalleryCreatePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GalleryCreateForm />
      </main>
      <Footer />
    </div>
  )
}
