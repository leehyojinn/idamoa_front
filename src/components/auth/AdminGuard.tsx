'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { showErrorToast } from '@/lib/errorHandler'

interface AdminGuardProps {
  children: React.ReactNode
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter()
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    const checkAdminPermission = () => {
      console.log('🔐 AdminGuard 체크:', {
        _hasHydrated,
        hasUser: !!user,
        userRole: user?.currentRole,
        hasChecked
      })

      // hydration이 완료될 때까지 대기
      if (!_hasHydrated) {
        console.log('⏳ hydration 대기 중...')
        return
      }

      // 이미 체크했으면 다시 체크하지 않음 (중복 리다이렉트 방지)
      if (hasChecked) {
        console.log('⏭️ 이미 체크 완료 - 스킵')
        return
      }

      // 로그인하지 않은 경우 (user가 없으면)
      if (!user) {
        console.log('❌ 로그인 필요 - /login으로 이동')
        setHasChecked(true)
        showErrorToast(null, '로그인이 필요합니다')
        router.push('/login')
        return
      }

      // 관리자가 아닌 경우
      if (user.currentRole !== 'ADMIN') {
        console.log('❌ 일반 회원 - /로 이동')
        setHasChecked(true)
        showErrorToast(null, '관리자 권한이 필요합니다')
        router.push('/')
        return
      }

      console.log('✅ 관리자 확인 완료')
      setHasChecked(true)
      setIsChecking(false)
    }

    checkAdminPermission()
  }, [user, _hasHydrated, router, hasChecked])

  // 권한 체크 중에는 로딩 표시
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">권한을 확인하는 중...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
