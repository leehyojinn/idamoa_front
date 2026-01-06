'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { FaBell } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { getNotifications, getUnreadCount, markAsRead as markAsReadAPI, deleteNotification } from '@/lib/api/notification'
import { useAuth } from '@/hooks/useAuth'
import { useNotificationWebSocket } from '@/hooks/useNotificationWebSocket'
import type { Notification } from '@/types/notification'

export default function NotificationDropdown() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // WebSocket 기능 활성화
  const ENABLE_WEBSOCKET = true

  // WebSocket 콜백
  const handleNotificationReceived = useCallback((notification: Notification) => {
    // 새 알림을 목록 맨 앞에 추가
    setNotifications((prev) => [notification, ...prev])
    // 미읽음 개수 증가
    setUnreadCount((prev) => prev + 1)
  }, [])

  const handleUnreadCountChanged = useCallback((count: number) => {
    setUnreadCount(count)
  }, [])

  // WebSocket 연결
  const { isConnected, markAsRead: markAsReadWS } = useNotificationWebSocket({
    onNotificationReceived: handleNotificationReceived,
    onUnreadCountChanged: handleUnreadCountChanged,
    enabled: ENABLE_WEBSOCKET && !!user,
  })

  // 미읽음 알림 개수 조회 (초기 로드용)
  const fetchUnreadCount = async () => {
    if (!user) return

    try {
      const result = await getUnreadCount()
      setUnreadCount(result.unreadCount || 0)
    } catch (error) {
      // 에러는 errorHandler에서 처리, 0으로 설정
      setUnreadCount(0)
    }
  }

  // 알림 목록 조회
  const fetchNotifications = async () => {
    if (!user || loading) return

    setLoading(true)
    try {
      const result = await getNotifications(0, 10)
      setNotifications(result.notifications || [])
    } catch (error) {
      // 에러는 errorHandler에서 처리, 빈 배열로 설정
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  // 알림 읽음 처리
  const handleMarkAsRead = async (uuid: string) => {
    try {
      // WebSocket이 연결되어 있으면 WebSocket으로 전송, 아니면 REST API 사용
      if (ENABLE_WEBSOCKET && isConnected) {
        markAsReadWS(uuid)
      } else {
        await markAsReadAPI(uuid)
      }

      // 알림 목록 갱신
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.uuid === uuid ? { ...notif, isRead: true, readAt: new Date().toISOString() } : notif
        )
      )
      // 미읽음 개수 감소
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      // 에러는 errorHandler에서 처리
    }
  }

  // 알림 삭제
  const handleDelete = async (uuid: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteNotification(uuid)
      // 알림 목록에서 제거
      setNotifications((prev) => prev.filter((notif) => notif.uuid !== uuid))
      // 미읽음 개수 갱신
      await fetchUnreadCount()
    } catch (error) {
      // 에러는 errorHandler에서 처리
    }
  }

  // 알림 클릭 처리 (읽음 처리만)
  const handleNotificationClick = async (notification: Notification) => {
    // 읽지 않은 알림이면 읽음 처리
    if (!notification.isRead) {
      await handleMarkAsRead(notification.uuid)
    }
  }

  // 드롭다운 토글
  const toggleDropdown = () => {
    setIsOpen((prev) => {
      const newState = !prev
      // 드롭다운을 열 때만 목록 새로고침 (WebSocket 비활성화 시에만)
      if (newState && !ENABLE_WEBSOCKET) {
        fetchNotifications()
      }
      return newState
    })
  }

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // 초기 데이터 로드 및 폴링 설정
  useEffect(() => {
    if (!user) return

    // 초기 미읽음 개수 조회
    fetchUnreadCount()

    // 초기 알림 목록 조회 (웹소켓 수신을 위해 미리 로드)
    if (ENABLE_WEBSOCKET) {
      fetchNotifications()
    }

    // WebSocket이 비활성화되어 있으면 30초마다 폴링
    if (!ENABLE_WEBSOCKET) {
      const interval = setInterval(() => {
        fetchUnreadCount()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [user, ENABLE_WEBSOCKET])

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diff < 60) return '방금 전'
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`

    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }

  // 로그인하지 않은 사용자는 렌더링하지 않음
  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 알림 아이콘 버튼 */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="알림"
        aria-expanded={isOpen}
      >
        <FaBell className="w-5 h-5" />
        {/* 미읽음 배지 */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 드롭다운 메뉴 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">알림</h3>
              {unreadCount > 0 && (
                <span className="text-sm text-gray-500">미읽음 {unreadCount}개</span>
              )}
            </div>

            {/* 알림 목록 */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : !notifications || notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <FaBell className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">알림이 없습니다</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <li
                      key={notification.uuid}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.isRead ? 'bg-primary-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* 제목 */}
                          <div className="flex items-center gap-2 mb-1">
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-primary-800 rounded-full flex-shrink-0"></span>
                            )}
                            <h4 className="font-medium text-sm text-gray-900 truncate">
                              {notification.title}
                            </h4>
                          </div>
                          {/* 내용 */}
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {notification.content}
                          </p>
                          {/* 시간 */}
                          <p className="text-xs text-gray-500">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>

                        {/* 삭제 버튼 */}
                        <button
                          onClick={(e) => handleDelete(notification.uuid, e)}
                          className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="삭제"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
