'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { FiMessageSquare, FiX, FiSend, FiImage, FiPaperclip, FiRefreshCw, FiSearch } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useDirectChat } from '@/hooks/useDirectChat'
import { useAuthStore } from '@/stores/authStore'
import { createOrGetChatRoom, getMessages, uploadChatFile, sendMessage as sendMessageRest } from '@/lib/api/directChat'
import { showErrorToast } from '@/lib/errorHandler'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { ChatRoom, ChatMessage, TypingStatus } from '@/types/directChat'

interface StartChatButtonProps {
  targetUserUuid: string
  targetUserName: string
  className?: string
  variant?: 'icon' | 'button' | 'text'
}

export default function StartChatButton({
  targetUserUuid,
  targetUserName,
  className = '',
  variant = 'button',
}: StartChatButtonProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // 채팅방 관련 상태
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [otherUserTyping, setOtherUserTyping] = useState(false)

  // 검색 관련 상태
  const [messageSearchQuery, setMessageSearchQuery] = useState('')
  const [isMessageSearchOpen, setIsMessageSearchOpen] = useState(false)

  // 스크롤 관련 ref
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const shouldScrollToBottom = useRef(true)

  // WebSocket 훅
  const { sendMessage, notifyTyping } = useDirectChat({
    roomUuid: chatRoom?.uuid || '',
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
    onTyping: useCallback(
      (status: TypingStatus) => {
        if (status.userUuid !== user?.id) {
          setOtherUserTyping(status.isTyping)
        }
      },
      [user?.id]
    ),
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

  // 채팅 시작
  const handleStartChat = async () => {
    if (!user) {
      showErrorToast(null, '로그인이 필요합니다')
      router.push('/login')
      return
    }

    if (user.id === targetUserUuid) {
      showErrorToast(null, '자기 자신과 채팅할 수 없습니다')
      return
    }

    setIsOpen(true)
    setIsLoading(true)

    try {
      const response = await createOrGetChatRoom({ targetUserUuid })
      if (response.success && response.data) {
        setChatRoom(response.data)
        setCurrentPage(0)
        setHasMore(true)

        // 메시지 로드 (최근 30개)
        const msgResponse = await getMessages(response.data.uuid, 0, 30)
        if (msgResponse.success && msgResponse.data) {
          setMessages(msgResponse.data.content.reverse())
          setHasMore(msgResponse.data.content.length >= 30)
        }
      }
    } catch (error) {
      showErrorToast(error, '채팅방을 열 수 없습니다')
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  // 이전 메시지 더 불러오기
  const loadMoreMessages = async () => {
    if (!chatRoom || isLoadingMore || !hasMore) return

    shouldScrollToBottom.current = false
    setIsLoadingMore(true)
    const nextPage = currentPage + 1

    try {
      const response = await getMessages(chatRoom.uuid, nextPage, 30)
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

  // 메시지 새로고침
  const refreshMessages = async () => {
    if (!chatRoom) return
    setIsLoading(true)
    setCurrentPage(0)
    setHasMore(true)
    try {
      const response = await getMessages(chatRoom.uuid, 0, 30)
      if (response.success && response.data) {
        setMessages(response.data.content.reverse())
        setHasMore(response.data.content.length >= 30)
      }
    } catch (error) {
      console.error('메시지 새로고침 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !chatRoom) return

    const messageContent = messageInput.trim()
    setMessageInput('')

    // WebSocket으로 먼저 시도
    const wsSuccess = sendMessage({
      content: messageContent,
      messageType: 'TEXT',
    })

    if (wsSuccess) {
      // WebSocket 성공 시 서버에서 브로드캐스트로 메시지가 돌아옴
      // onMessage 콜백에서 처리됨
    } else {
      // WebSocket 실패 시 REST API로 폴백
      try {
        const response = await sendMessageRest(chatRoom.uuid, {
          content: messageContent,
          messageType: 'TEXT',
        })
        if (response.success && response.data) {
          setMessages((prev) => [...prev, response.data!])
        }
      } catch (error) {
        showErrorToast(error, '메시지 전송에 실패했습니다')
        setMessageInput(messageContent)
      }
    }
  }

  // 입력 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value)
    notifyTyping()
  }

  // 파일 업로드
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !chatRoom) return

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

  // 닫기
  const handleClose = () => {
    setIsOpen(false)
    setChatRoom(null)
    setMessages([])
    setMessageInput('')
    setMessageSearchQuery('')
    setIsMessageSearchOpen(false)
    setCurrentPage(0)
    setHasMore(true)
  }

  // 버튼 렌더링
  const renderButton = () => {
    switch (variant) {
      case 'icon':
        return (
          <button
            onClick={handleStartChat}
            className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
            title={`${targetUserName}님과 채팅`}
          >
            <FiMessageSquare className="w-5 h-5 text-green-600" />
          </button>
        )
      case 'text':
        return (
          <button
            onClick={handleStartChat}
            className={`text-green-600 hover:text-green-700 font-medium flex items-center gap-1 ${className}`}
          >
            <FiMessageSquare className="w-4 h-4" />
            채팅하기
          </button>
        )
      default:
        return (
          <button
            onClick={handleStartChat}
            className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${className}`}
          >
            <FiMessageSquare className="w-5 h-5" />
            <span>채팅하기</span>
          </button>
        )
    }
  }

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
            onClick={handleClose}
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
            <div className="bg-green-600 text-white p-4 flex items-center gap-3">
              <h2 className="font-bold flex-1">{targetUserName}</h2>
              {chatRoom && (
                <>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      chatRoom.otherUser.isOnline ? 'bg-green-300' : 'bg-gray-400'
                    }`}
                  />
                  <button
                    onClick={refreshMessages}
                    disabled={isLoading}
                    className="p-1 hover:bg-green-700 rounded disabled:opacity-50"
                    title="새로고침"
                  >
                    <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => {
                      setIsMessageSearchOpen(!isMessageSearchOpen)
                      if (isMessageSearchOpen) setMessageSearchQuery('')
                    }}
                    className={`p-1 hover:bg-green-700 rounded ${isMessageSearchOpen ? 'bg-green-700' : ''}`}
                    title="메시지 검색"
                  >
                    <FiSearch className="w-5 h-5" />
                  </button>
                </>
              )}
              <button onClick={handleClose} className="p-1 hover:bg-green-700 rounded">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent" />
                </div>
              ) : (
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
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
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

                  {/* 메시지 영역 */}
                  <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <FiMessageSquare className="w-12 h-12 mb-2" />
                        <p>{messageSearchQuery ? '검색 결과가 없습니다' : `${targetUserName}님과 대화를 시작하세요`}</p>
                      </div>
                    ) : (
                      <>
                        {/* 이전 메시지 더 보기 */}
                        {hasMore && !messageSearchQuery && (
                          <div className="flex justify-center mb-2">
                            <button
                              onClick={loadMoreMessages}
                              disabled={isLoadingMore}
                              className="text-xs text-green-600 hover:text-green-800 disabled:text-gray-400 py-1 px-3 rounded-full bg-green-50 hover:bg-green-100 transition-colors"
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
                                ? 'bg-green-600 text-white'
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
                                message.isMine ? 'text-green-200' : 'text-gray-400'
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
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiSend className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return (
    <>
      {renderButton()}
      {dialog && createPortal(dialog, document.body)}
    </>
  )
}
