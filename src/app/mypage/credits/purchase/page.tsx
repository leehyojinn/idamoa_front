'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function CreditPurchasePage() {
  const router = useRouter()

  useEffect(() => {
    toast('크레딧 충전 서비스 준비중입니다.', {
      icon: '🚧',
      duration: 3000,
    })
    router.replace('/mypage')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">잠시만 기다려주세요...</p>
      </div>
    </div>
  )
}
