import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function ResourcesPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            자료실
          </h1>
          <p className="text-lg text-gray-600">
            곧 서비스 예정입니다.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
