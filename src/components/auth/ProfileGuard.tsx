'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { showErrorToast } from '@/lib/errorHandler'

// 프로필 체크를 건너뛸 경로들
const SKIP_PATHS = [
  '/login',
  '/signup',
  '/signup/verify',
  '/signup/profile-type',
  '/signup/profile/user',
  '/signup/profile/company',
  '/password/find',
  '/password/reset',
]

export default function ProfileGuard() {
  const router = useRouter()
  const pathname = usePathname()
  const accessToken = useAuthStore((state) => state.accessToken)

  useEffect(() => {
    const checkProfile = async () => {
      // 건너뛸 경로인지 확인
      if (SKIP_PATHS.some(path => pathname.startsWith(path))) {
        return
      }

      // 로그인 여부 확인
      if (!accessToken) {
        return // 로그인하지 않은 경우 체크하지 않음
      }

      // 프로필 상태 확인
      try {
        const { getProfileStatus } = await import('@/lib/api/profile')
        const response = await getProfileStatus()

        if (!response.data.profileCompleted) {
          showErrorToast(null, '프로필 등록이 필요합니다')
          router.push('/signup/profile-type')
        }
      } catch (error) {
        // 프로필 상태 확인 실패 시 무시
      }
    }

    checkProfile()
  }, [pathname, router, accessToken])

  return null
}
