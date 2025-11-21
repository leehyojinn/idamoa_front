import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import DocumentCreateForm from '@/components/resource/DocumentCreateForm'

export default function DocumentCreatePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <DocumentCreateForm />
      </main>
      <Footer />
    </div>
  )
}
