'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { FiMessageSquare, FiX, FiArrowLeft, FiSend, FiPaperclip, FiImage, FiRefreshCw, FiSearch, FiLogOut } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useDirectChat } from '@/hooks/useDirectChat'
import { useAuthStore } from '@/stores/authStore'
import {
  getChatRooms,
  getMessages,
  createOrGetChatRoom,
  getTotalUnreadCount,
  uploadChatFile,
  sendMessage as sendMessageRest,
  leaveChatRoom,
} from '@/lib/api/directChat'
import { showErrorToast } from '@/lib/errorHandler'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { ChatRoom, ChatMessage, TypingStatus } from '@/types/directChat'

interface FloatingChatButtonProps {
  targetUserUuid?: string // 특정 사용자와 채팅 시작할 때 사용
  targetUserName?: string
}

export default function FloatingChatButton({
  targetUserUuid,
  targetUserName,
}: FloatingChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { user } = useAuth()

  // 채팅방 관련 상태
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [totalUnreadCount, setTotalUnreadCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // 입력 관련 상태
  const [messageInput, setMessageInput] = useState('')
  const [otherUserTyping, setOtherUserTyping] = useState(false)

  // 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState('')
  const [messageSearchQuery, setMessageSearchQuery] = useState('')
  const [isMessageSearchOpen, setIsMessageSearchOpen] = useState(false)

  // 나가기 다이얼로그 상태
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)

  // 스크롤 관련 ref
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const shouldScrollToBottom = useRef(true)

  // WebSocket 훅
  const {
    sendMessage,
    notifyTyping,
  } = useDirectChat({
    roomUuid: selectedRoom?.uuid || '',
    onMessage: useCallback((message: ChatMessage) => {
      const currentUser = useAuthStore.getState().user
      // sender 객체에서 이메일 가져오기 (백엔드는 sender.email 형태로 보냄)
      const senderEmail = (message as any).sender?.email
      const isMine = senderEmail === currentUser?.email

      setMessages((prev) => {
        // 중복 체크
        if (prev.some((m) => m.uuid === message.uuid)) {
          return prev
        }
        return [...prev, { ...message, isMine }]
      })
    }, []),
    onTyping: useCallback((status: TypingStatus) => {
      if (status.userUuid !== user?.id) {
        setOtherUserTyping(status.isTyping)
      }
    }, [user?.id]),
    onError: useCallback((error: Error) => {
      console.error('채팅 에러:', error)
    }, []),
  })

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 미읽음 수 조회
  useEffect(() => {
    if (!user) return

    const fetchUnreadCount = async () => {
      try {
        const response = await getTotalUnreadCount()
        if (response.success && response.data) {
          // API 응답이 { count: number } 형태
          const data = response.data as { count: number } | number
          const count = typeof data === 'number' ? data : data.count
          setTotalUnreadCount(count || 0)
        }
      } catch (error) {
        console.error('미읽음 수 조회 실패:', error)
      }
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000) // 30초마다 갱신
    return () => clearInterval(interval)
  }, [user])

  // 채팅방 목록 조회
  const loadChatRooms = async () => {
    if (!user) return

    setIsLoadingRooms(true)
    try {
      const response = await getChatRooms()
      if (response.success && response.data) {
        setChatRooms(response.data)
      }
    } catch (error) {
      showErrorToast(error, '채팅방 목록을 불러오는데 실패했습니다')
    } finally {
      setIsLoadingRooms(false)
    }
  }

  // 특정 사용자와 채팅 시작
  const startChatWithUser = async (userUuid: string) => {
    if (!user) {
      showErrorToast(null, '로그인이 필요합니다')
      return
    }

    try {
      const response = await createOrGetChatRoom({ targetUserUuid: userUuid })
      if (response.success && response.data) {
        setSelectedRoom(response.data)
        await loadMessages(response.data.uuid)
      }
    } catch (error) {
      showErrorToast(error, '채팅방을 생성하는데 실패했습니다')
    }
  }

  // 메시지 목록 조회 (최근 30개)
  const loadMessages = async (roomUuid: string) => {
    setIsLoadingMessages(true)
    setCurrentPage(0)
    setHasMore(true)
    try {
      const response = await getMessages(roomUuid, 0, 30)
      if (response.success && response.data) {
        // API는 최신순이므로 reverse
        setMessages(response.data.content.reverse())
        setHasMore(response.data.content.length >= 30)
      }
    } catch (error) {
      showErrorToast(error, '메시지를 불러오는데 실패했습니다')
    } finally {
      setIsLoadingMessages(false)
    }
  }

  // 이전 메시지 더 불러오기
  const loadMoreMessages = async () => {
    if (!selectedRoom || isLoadingMore || !hasMore) return

    shouldScrollToBottom.current = false
    setIsLoadingMore(true)
    const nextPage = currentPage + 1

    try {
      const response = await getMessages(selectedRoom.uuid, nextPage, 30)
      if (response.success && response.data) {
        const olderMessages = response.data.content.reverse()
        setMessages((prev) => [...olderMessages, ...prev])
        setCurrentPage(nextPage)
        setHasMore(response.data.content.length >= 30)
      }
    } catch (error) {
      console.error('이전 메시지 로드 실패:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // 채팅 열기
  const handleOpen = async () => {
    setIsOpen(true)

    if (targetUserUuid) {
      // 특정 사용자와 채팅 시작
      await startChatWithUser(targetUserUuid)
    } else {
      // 채팅방 목록 로드
      await loadChatRooms()
    }
  }

  // 채팅방 선택
  const handleSelectRoom = async (room: ChatRoom) => {
    setSelectedRoom(room)
    await loadMessages(room.uuid)
  }

  // 메시지 새로고침
  const refreshMessages = async () => {
    if (!selectedRoom) return
    setIsLoadingMessages(true)
    setCurrentPage(0)
    setHasMore(true)
    try {
      const response = await getMessages(selectedRoom.uuid, 0, 30)
      if (response.success && response.data) {
        setMessages(response.data.content.reverse())
        setHasMore(response.data.content.length >= 30)
      }
    } catch (error) {
      console.error('메시지 새로고침 실패:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedRoom) return

    const messageContent = messageInput.trim()
    setMessageInput('')

    // WebSocket으로 먼저 시도
    const wsSuccess = sendMessage({
      content: messageContent,
      messageType: 'TEXT',
    })

    if (wsSuccess) {
      // WebSocket 성공 시 서버에서 브로드캐스트로 메시지가 돌아옴
    } else {
      // WebSocket 실패 시 REST API로 폴백
      try {
        const response = await sendMessageRest(selectedRoom.uuid, {
          content: messageContent,
          messageType: 'TEXT',
        })
        if (response.success && response.data) {
          // REST API 성공 시 메시지 추가
          setMessages((prev) => [...prev, response.data!])
        }
      } catch (error) {
        showErrorToast(error, '메시지 전송에 실패했습니다')
        setMessageInput(messageContent) // 실패 시 입력 복원
      }
    }
  }

  // 입력 중 타이핑 알림
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value)
    notifyTyping()
  }

  // 파일 업로드
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedRoom) return

    try {
      const uploadedFile = await uploadChatFile(file)
      const messageType = file.type.startsWith('image/') ? 'IMAGE' : 'FILE'

      sendMessage({
        content: file.name,
        messageType,
        fileUuids: [uploadedFile.uuid],
      })
    } catch (error) {
      showErrorToast(error, '파일 업로드에 실패했습니다')
    }

    e.target.value = ''
  }

  // 뒤로가기
  const handleBack = () => {
    setSelectedRoom(null)
    setMessages([])
    setMessageSearchQuery('')
    setIsMessageSearchOpen(false)
    setCurrentPage(0)
    setHasMore(true)
    loadChatRooms()
  }

  // 채팅방 나가기 확인
  const handleLeaveRoom = () => {
    setShowLeaveDialog(true)
  }

  // 채팅방 나가기 실행
  const confirmLeaveRoom = async () => {
    if (!selectedRoom) return

    try {
      const response = await leaveChatRoom(selectedRoom.uuid)
      if (response.success) {
        setShowLeaveDialog(false)
        setSelectedRoom(null)
        setMessages([])
        loadChatRooms()
      }
    } catch (error) {
      showErrorToast(error, '채팅방 나가기에 실패했습니다')
    }
  }

  // 시간 포맷
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ko })
    } catch {
      return ''
    }
  }

  // 스크롤을 맨 아래로 이동
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // 메시지가 변경되면 스크롤 맨 아래로 (이전 메시지 로드 시 제외)
  useEffect(() => {
    if (messages.length > 0 && shouldScrollToBottom.current) {
      scrollToBottom()
    }
    shouldScrollToBottom.current = true
  }, [messages, scrollToBottom])

  // 검색 필터링된 채팅방 목록
  const filteredChatRooms = chatRooms.filter((room) =>
    room.otherUser.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 메시지 검색 필터링
  const filteredMessages = messageSearchQuery
    ? messages.filter((msg) =>
        msg.content.toLowerCase().includes(messageSearchQuery.toLowerCase())
      )
    : messages

  // 검색어 하이라이트 함수
  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-300 text-black rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  if (!user) return null

  const dialog = mounted && (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Chat Panel */}
          <motion.div
            initial={{ opacity: 0, y: isMobile ? '100%' : 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isMobile ? '100%' : 20 }}
            className={`bg-white shadow-2xl overflow-hidden flex flex-col ${
              isMobile
                ? 'fixed inset-x-0 bottom-0 rounded-t-2xl h-[85vh]'
                : 'fixed w-96 h-[600px] rounded-lg'
            }`}
            style={{
              position: 'fixed',
              bottom: isMobile ? '0' : '88px',
              right: isMobile ? '0' : '24px',
              left: isMobile ? '0' : 'auto',
              zIndex: 60,
            }}
          >
            {/* Header */}
            <div className="bg-primary text-white p-4 flex items-center gap-3">
              {selectedRoom && (
                <button onClick={handleBack} className="p-1 hover:bg-primary-800 rounded">
                  <FiArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className="font-bold flex-1">
                {selectedRoom
                  ? selectedRoom.otherUser.nickname
                  : targetUserName || '채팅'}
              </h2>
              {selectedRoom && (
                <>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedRoom.otherUser.isOnline ? 'bg-green-400' : 'bg-gray-400'
                    }`}
                  />
                  <button
                    onClick={refreshMessages}
                    disabled={isLoadingMessages}
                    className="p-1 hover:bg-primary-800 rounded disabled:opacity-50"
                    title="새로고침"
                  >
                    <FiRefreshCw className={`w-5 h-5 ${isLoadingMessages ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => {
                      setIsMessageSearchOpen(!isMessageSearchOpen)
                      if (isMessageSearchOpen) setMessageSearchQuery('')
                    }}
                    className={`p-1 hover:bg-primary-800 rounded ${isMessageSearchOpen ? 'bg-primary-700' : ''}`}
                    title="메시지 검색"
                  >
                    <FiSearch className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleLeaveRoom}
                    className="p-1 hover:bg-red-600 rounded"
                    title="채팅방 나가기"
                  >
                    <FiLogOut className="w-5 h-5" />
                  </button>
                </>
              )}
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-primary-800 rounded">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {!selectedRoom ? (
                // 채팅방 목록
                <div className="flex-1 overflow-y-auto flex flex-col">
                  {/* 검색 입력 */}
                  <div className="p-3 border-b">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="대화방 검색"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  {isLoadingRooms ? (
                    <div className="flex items-center justify-center flex-1">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                    </div>
                  ) : filteredChatRooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-gray-500">
                      <FiMessageSquare className="w-12 h-12 mb-2" />
                      <p>{searchQuery ? '검색 결과가 없습니다' : '채팅 내역이 없습니다'}</p>
                    </div>
                  ) : (
                    <div className="divide-y flex-1 overflow-y-auto">
                      {filteredChatRooms.map((room) => (
                        <button
                          key={room.uuid}
                          onClick={() => handleSelectRoom(room)}
                          className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          {/* 프로필 이미지 */}
                          <div className="relative">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              {room.otherUser.profileImageUrl ? (
                                <img
                                  src={room.otherUser.profileImageUrl}
                                  alt=""
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-gray-500 font-bold">
                                  {room.otherUser.nickname.charAt(0)}
                                </span>
                              )}
                            </div>
                            {room.otherUser.isOnline && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                            )}
                          </div>

                          {/* 정보 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-900">
                                {room.otherUser.nickname}
                              </span>
                              {room.lastMessageAt && (
                                <span className="text-xs text-gray-400">
                                  {formatTime(room.lastMessageAt)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              {room.lastMessage || '대화를 시작하세요'}
                            </p>
                          </div>

                          {/* 미읽음 배지 */}
                          {room.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                              {room.unreadCount > 999 ? '999+' : room.unreadCount}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // 메시지 뷰
                <>
                  {/* 메시지 검색 입력 */}
                  {isMessageSearchOpen && (
                    <div className="p-2 border-b bg-gray-50">
                      <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={messageSearchQuery}
                          onChange={(e) => setMessageSearchQuery(e.target.value)}
                          placeholder="메시지 검색"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm"
                          autoFocus
                        />
                        {messageSearchQuery && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                            {filteredMessages.length}개 결과
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                      </div>
                    ) : filteredMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <p>{messageSearchQuery ? '검색 결과가 없습니다' : '대화를 시작하세요'}</p>
                      </div>
                    ) : (
                      <>
                        {/* 이전 메시지 더 보기 */}
                        {hasMore && !messageSearchQuery && (
                          <div className="flex justify-center mb-2">
                            <button
                              onClick={loadMoreMessages}
                              disabled={isLoadingMore}
                              className="text-xs text-primary hover:text-primary disabled:text-gray-400 py-1 px-3 rounded-full bg-primary-50 hover:bg-primary-100 transition-colors"
                            >
                              {isLoadingMore ? '불러오는 중...' : '이전 메시지 보기'}
                            </button>
                          </div>
                        )}
                        {filteredMessages.map((message) => (
                        <div
                          key={message.uuid}
                          className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              message.isMine
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            {message.messageType === 'IMAGE' && message.attachments[0] && (
                              <img
                                src={message.attachments[0].fileUrl}
                                alt=""
                                className="rounded mb-1 max-w-full"
                              />
                            )}
                            {message.messageType === 'FILE' && message.attachments[0] && (
                              <a
                                href={message.attachments[0].fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 underline"
                              >
                                <FiPaperclip className="w-4 h-4" />
                                {message.attachments[0].originalFilename}
                              </a>
                            )}
                            {(message.messageType === 'TEXT' || message.messageType === 'SYSTEM') && (
                              <p className="break-words">
                                {highlightText(message.content, messageSearchQuery)}
                              </p>
                            )}
                            <span
                              className={`text-xs mt-1 block ${
                                message.isMine ? 'text-primary-200' : 'text-gray-400'
                              }`}
                            >
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                        </div>
                        ))}
                      </>
                    )}
                    {otherUserTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg px-4 py-2 text-gray-500 text-sm">
                          입력 중...
                        </div>
                      </div>
                    )}
                    {/* 스크롤 하단 앵커 */}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* 입력 영역 */}
                  <div className="border-t p-3 flex items-center gap-2">
                    <label className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                      <FiImage className="w-5 h-5 text-gray-500" />
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                    <input
                      type="text"
                      value={messageInput}
                      onChange={handleInputChange}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="메시지를 입력하세요"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className="p-2 bg-primary text-white rounded-full hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiSend className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* 채팅방 나가기 확인 다이얼로그 */}
          {showLeaveDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4"
              onClick={() => setShowLeaveDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">채팅방 나가기</h3>
                <p className="text-gray-600 mb-6">
                  {selectedRoom?.otherUser.nickname}님과의 채팅방을 나가시겠습니까?
                  <br />
                  <span className="text-red-500 text-sm">대화 내용이 삭제됩니다.</span>
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLeaveDialog(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={confirmLeaveRoom}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    나가기
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  )

  return (
    <>
      {/* 플로팅 버튼 */}
      <motion.button
        onClick={handleOpen}
        className={`fixed z-40 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-colors ${
          isMobile ? 'bottom-40 right-4' : 'bottom-24 right-6'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="채팅"
      >
        <FiMessageSquare className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold min-w-[20px] h-[20px] px-1.5 rounded-full flex items-center justify-center shadow-md">
            {totalUnreadCount > 999 ? '999+' : totalUnreadCount}
          </span>
        )}
      </motion.button>

      {/* 다이얼로그 - Portal로 렌더링 */}
      {dialog && createPortal(dialog, document.body)}
    </>
  )
}
