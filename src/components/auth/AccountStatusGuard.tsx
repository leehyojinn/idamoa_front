'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { getMyInfo } from '@/lib/api/auth'
import { logout as logoutApi } from '@/lib/api/auth'

export default function AccountStatusGuard() {
  const router = useRouter()
  const { user, isAuthenticated, clearAuth, setUser, _hasHydrated } = useAuthStore()
  const [showSuspendedDialog, setShowSuspendedDialog] = useState(false)
  const [showInactiveDialog, setShowInactiveDialog] = useState(false)
  const [showPendingDialog, setShowPendingDialog] = useState(false)

  useEffect(() => {
    const checkAccountStatus = async () => {
      // hydration이 완료되지 않았거나 로그인하지 않은 경우 체크하지 않음
      if (!_hasHydrated || !isAuthenticated || !user) {
        return
      }

      try {
        // 사용자 정보를 가져와서 상태 확인
        const response = await getMyInfo()

        if (response.success && response.data) {
          const { status } = response.data

          // 사용자 정보 업데이트 (status 포함)
          setUser({
            ...user,
            status: status,
            name: response.data.name,
            id: response.data.id.toString(),
          })

          // 상태에 따라 다이얼로그 표시
          if (status === 'SUSPENDED') {
            setShowSuspendedDialog(true)
          } else if (status === 'INACTIVE') {
            setShowInactiveDialog(true)
          } else if (status === 'PENDING') {
            setShowPendingDialog(true)
          }
        }
      } catch (error) {
        console.error('Failed to check account status:', error)
      }
    }

    // 로그인 후 상태 확인 (최초 1회)
    checkAccountStatus()
  }, [_hasHydrated, isAuthenticated, user?.email]) // user?.email을 의존성으로 사용하여 로그인 시에만 체크

  const handleLogout = async () => {
    try {
      await logoutApi()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuth()
      setShowSuspendedDialog(false)
      setShowInactiveDialog(false)
      setShowPendingDialog(false)
      router.push('/login')
    }
  }

  return (
    <>
      {/* 정지된 계정 다이얼로그 */}
      {showSuspendedDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                계정이 정지되었습니다
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                귀하의 계정은 관리자에 의해 정지되었습니다.
                <br />
                자세한 내용은 고객센터로 문의해주세요.
              </p>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 비활성 계정 다이얼로그 */}
      {showInactiveDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                <svg
                  className="h-6 w-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                비활성 계정입니다
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                귀하의 계정은 비활성 상태입니다.
                <br />
                계정을 활성화하려면 고객센터로 문의해주세요.
              </p>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 승인 대기 계정 다이얼로그 */}
      {showPendingDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                승인 대기 중입니다
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                귀하의 계정은 현재 승인 대기 중입니다.
                <br />
                관리자의 승인 후 서비스를 이용하실 수 있습니다.
              </p>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
