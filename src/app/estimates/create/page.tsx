import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import EstimateCreateForm from '@/components/estimate/EstimateCreateForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '견적 요청 등록 | 다모아',
  description: '새로운 견적 요청을 등록하세요',
}

export default function EstimateCreatePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary to-indigo-700 text-white py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">견적 요청 등록</h1>
            <p className="text-xl text-primary-100">
              프로젝트 정보를 입력하고 전문 업체들로부터 견적을 받아보세요
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <EstimateCreateForm />
        </div>
      </main>
      <Footer />
    </>
  )
}
