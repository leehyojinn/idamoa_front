'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaBell, FaArrowLeft, FaCheck, FaTrash, FaCircle } from 'react-icons/fa'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuthStore } from '@/stores/authStore'
import { getNotifications, markAsRead, deleteNotification } from '@/lib/api/notification'
import { showErrorToast } from '@/lib/errorHandler'
import toast from 'react-hot-toast'
import type { Notification, NotificationType } from '@/types/notification'

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, { label: string; color: string }> = {
  ESTIMATE_NEW_PROPOSAL: { label: '새 제안', color: 'bg-blue-100 text-blue-700' },
  ESTIMATE_PROPOSAL_ACCEPTED: { label: '제안 수락', color: 'bg-green-100 text-green-700' },
  ESTIMATE_PROPOSAL_REJECTED: { label: '제안 거절', color: 'bg-red-100 text-red-700' },
  ESTIMATE_STATUS_CHANGED: { label: '상태 변경', color: 'bg-yellow-100 text-yellow-700' },
  COMPANY_VERIFICATION_APPROVED: { label: '인증 승인', color: 'bg-green-100 text-green-700' },
  COMPANY_VERIFICATION_REJECTED: { label: '인증 거절', color: 'bg-red-100 text-red-700' },
  SYSTEM_NOTICE: { label: '시스템', color: 'bg-gray-100 text-gray-700' },
  POPUP_PUBLISHED: { label: '팝업 게시', color: 'bg-purple-100 text-purple-700' },
  POPUP_EXPIRED: { label: '팝업 만료', color: 'bg-gray-100 text-gray-700' },
}

export default function CompanyNotificationsPage() {
  const router = useRouter()
  const { accessToken, _hasHydrated } = useAuthStore()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const size = 20

  useEffect(() => {
    if (!_hasHydrated) return
    if (!accessToken) {
      showErrorToast(null, '로그인이 필요한 페이지입니다')
      router.push('/login')
      return
    }
    setIsCheckingAuth(false)
  }, [router, accessToken, _hasHydrated])

  useEffect(() => {
    if (isCheckingAuth) return

    const fetchNotifications = async () => {
      try {
        const response = await getNotifications(page, size)
        setNotifications(response.notifications)
        setTotalCount(response.totalCount)
      } catch (error) {
        showErrorToast(error, '알림 목록을 불러오는데 실패했습니다')
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [isCheckingAuth, page])

  const handleMarkAsRead = async (uuid: string) => {
    try {
      await markAsRead(uuid)
      setNotifications((prev) =>
        prev.map((n) => (n.uuid === uuid ? { ...n, isRead: true } : n))
      )
      toast.success('읽음 처리되었습니다')
    } catch (error) {
      showErrorToast(error, '읽음 처리에 실패했습니다')
    }
  }

  const handleDelete = async (uuid: string) => {
    if (!confirm('이 알림을 삭제하시겠습니까?')) return
    try {
      await deleteNotification(uuid)
      setNotifications((prev) => prev.filter((n) => n.uuid !== uuid))
      setTotalCount((prev) => prev - 1)
      toast.success('알림이 삭제되었습니다')
    } catch (error) {
      showErrorToast(error, '알림 삭제에 실패했습니다')
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  if (isCheckingAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  const totalPages = Math.ceil(totalCount / size)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/mypage/company-dashboard')}
            className="p-2 rounded-lg bg-white shadow-sm hover:bg-gray-50"
          >
            <FaArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaBell className="text-primary" />
              알림
            </h1>
            <p className="text-gray-600 mt-1">총 {totalCount}개</p>
          </div>
        </div>

        {/* 알림 목록 */}
        {notifications.length > 0 ? (
          <>
            <div className="space-y-3">
              {notifications.map((notification) => {
                const typeInfo = NOTIFICATION_TYPE_LABELS[notification.notificationType] || {
                  label: '알림',
                  color: 'bg-gray-100 text-gray-700',
                }
                return (
                  <div
                    key={notification.uuid}
                    className={`bg-white rounded-lg shadow-sm p-4 ${
                      !notification.isRead ? 'border-l-4 border-primary' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* 읽지 않은 표시 */}
                      {!notification.isRead && (
                        <FaCircle className="w-2 h-2 text-primary mt-2 flex-shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}
                          >
                            {typeInfo.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600">{notification.content}</p>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.uuid)}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                            title="읽음 처리"
                          >
                            <FaCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.uuid)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <span className="px-4 py-2 text-gray-600">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <FaBell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">알림이 없습니다</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
