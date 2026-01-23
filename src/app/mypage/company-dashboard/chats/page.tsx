'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { FaArrowLeft, FaUser, FaCircle } from 'react-icons/fa'
import { IoChatbubbles } from 'react-icons/io5'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuthStore } from '@/stores/authStore'
import { getChatRooms } from '@/lib/api/directChat'
import { showErrorToast } from '@/lib/errorHandler'
import type { ChatRoom } from '@/types/directChat'

export default function CompanyChatsPage() {
  const router = useRouter()
  const { accessToken, _hasHydrated } = useAuthStore()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

    const fetchChatRooms = async () => {
      try {
        const response = await getChatRooms()
        if (response.success && response.data) {
          setChatRooms(response.data)
        }
      } catch (error) {
        showErrorToast(error, '채팅방 목록을 불러오는데 실패했습니다')
      } finally {
        setIsLoading(false)
      }
    }

    fetchChatRooms()
  }, [isCheckingAuth])

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

  const formatTime = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return '어제'
    } else if (days < 7) {
      return `${days}일 전`
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    }
  }

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
              <IoChatbubbles className="text-primary" />
              채팅
            </h1>
            <p className="text-gray-600 mt-1">총 {chatRooms.length}개의 대화</p>
          </div>
        </div>

        {/* 채팅방 목록 */}
        {chatRooms.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {chatRooms.map((room) => (
                <div
                  key={room.uuid}
                  onClick={() => router.push(`/mypage/company-dashboard/chats/${room.uuid}`)}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  {/* 프로필 이미지 */}
                  <div className="relative">
                    {room.otherUser.profileImageUrl ? (
                      <Image
                        src={room.otherUser.profileImageUrl}
                        alt={room.otherUser.nickname}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <FaUser className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    {room.otherUser.isOnline && (
                      <FaCircle className="absolute bottom-0 right-0 w-3 h-3 text-green-500" />
                    )}
                  </div>

                  {/* 채팅 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">
                        {room.otherUser.nickname}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(room.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {room.lastMessage || '대화를 시작해보세요'}
                    </p>
                  </div>

                  {/* 안읽은 메시지 */}
                  {room.unreadCount > 0 && (
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                      {room.unreadCount > 99 ? '99+' : room.unreadCount}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <IoChatbubbles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">진행 중인 채팅이 없습니다</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
