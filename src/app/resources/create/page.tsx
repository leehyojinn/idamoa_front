import { redirect } from 'next/navigation'

// 자료실 생성 페이지 숨김 처리 - 메인으로 리다이렉트
export default function DocumentCreatePage() {
  redirect('/')
}

/* 원래 코드 - 나중에 복원 시 주석 해제
'use client'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import DocumentCreateForm from '@/components/resource/DocumentCreateForm'

export const dynamic = 'force-dynamic'

export default function DocumentCreatePageOriginal() {
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
*/
