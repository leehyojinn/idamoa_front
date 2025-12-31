'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Client, IMessage, StompSubscription } from '@stomp/stompjs'
import { useAuthStore } from '@/stores/authStore'
import type { ChatMessage, TypingStatus, SendMessageRequest } from '@/types/directChat'

// SockJS를 클라이언트 사이드에서만 import
let SockJS: typeof import('sockjs-client') | null = null
if (typeof window !== 'undefined') {
  SockJS = require('sockjs-client')
}

const WS_URL = (process.env.NEXT_PUBLIC_SITE_URL || '') + '/ws'

// 디버그 로그 (프로덕션에서는 비활성화)
const DEBUG_ENABLED = false
const debug = (...args: unknown[]) => {
  if (DEBUG_ENABLED) {
    console.log('[DirectChat]', new Date().toISOString(), ...args)
  }
}

interface UseDirectChatOptions {
  roomUuid: string
  onMessage?: (message: ChatMessage) => void
  onTyping?: (status: TypingStatus) => void
  onError?: (error: Error) => void
  onConnected?: () => void
  onDisconnected?: () => void
}

export function useDirectChat({
  roomUuid,
  onMessage,
  onTyping,
  onError,
  onConnected,
  onDisconnected,
}: UseDirectChatOptions) {
  // 훅 호출 시마다 로그
  debug('🔄 useDirectChat 호출됨, roomUuid:', roomUuid || '(빈 문자열)')

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const clientRef = useRef<Client | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Zustand 스토어에서 토큰 가져오기
  const accessToken = useAuthStore((state) => state.accessToken)

  // 콜백을 ref로 저장하여 의존성 문제 해결
  const onMessageRef = useRef(onMessage)
  const onTypingRef = useRef(onTyping)
  const onErrorRef = useRef(onError)
  const onConnectedRef = useRef(onConnected)
  const onDisconnectedRef = useRef(onDisconnected)

  // 콜백이 바뀔 때 ref 업데이트
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])
  useEffect(() => {
    onTypingRef.current = onTyping
  }, [onTyping])
  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])
  useEffect(() => {
    onConnectedRef.current = onConnected
  }, [onConnected])
  useEffect(() => {
    onDisconnectedRef.current = onDisconnected
  }, [onDisconnected])

  // 수동 재연결 (필요시 사용)
  const reconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate()
      clientRef.current = null
    }
    // roomUuid가 있으면 useEffect가 다시 연결함
  }, [])

  // 메시지 전송 (WebSocket)
  const sendMessage = useCallback(
    (request: SendMessageRequest) => {
      debug('📤 메시지 전송 시도:', { connected: clientRef.current?.connected, request })

      if (!clientRef.current?.connected) {
        debug('❌ WebSocket 연결 안 됨, REST API 폴백 필요')
        return false
      }

      const destination = `/app/direct-chats/rooms/${roomUuid}/messages`
      debug('📤 메시지 전송:', destination)

      clientRef.current.publish({
        destination,
        body: JSON.stringify(request),
      })

      debug('✅ 메시지 전송 완료')
      return true
    },
    [roomUuid]
  )

  // 타이핑 상태 전송
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!clientRef.current?.connected) return

      clientRef.current.publish({
        destination: `/app/direct-chats/rooms/${roomUuid}/typing`,
        body: JSON.stringify({ isTyping }),
      })
    },
    [roomUuid]
  )

  // 타이핑 중 표시 (디바운스 적용)
  const notifyTyping = useCallback(() => {
    sendTyping(true)

    // 2초 후 타이핑 종료 알림
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false)
    }, 2000)
  }, [sendTyping])

  // 읽음 처리
  const markAsRead = useCallback(() => {
    if (!clientRef.current?.connected) return

    clientRef.current.publish({
      destination: `/app/direct-chats/rooms/${roomUuid}/read`,
      body: JSON.stringify({}),
    })
  }, [roomUuid])

  // roomUuid 또는 accessToken이 변경될 때 연결/해제
  useEffect(() => {
    debug('🔵 useEffect 실행됨, roomUuid:', roomUuid || '(빈 문자열)', 'accessToken:', accessToken ? '있음' : '없음')

    if (!roomUuid) {
      debug('roomUuid가 없어서 연결 안 함')
      return
    }

    if (!accessToken) {
      debug('accessToken이 없어서 연결 안 함')
      return
    }

    if (!SockJS) {
      debug('SockJS가 로드되지 않음 (SSR)')
      return
    }

    debug('🚀 WebSocket 연결 시작:', { roomUuid, wsUrl: WS_URL })

    // 구독 저장용
    const subscriptions: StompSubscription[] = []
    let isCleanedUp = false

    setIsConnecting(true)

    const client = new Client({
      webSocketFactory: () => {
        debug('SockJS 인스턴스 생성')
        return new SockJS(WS_URL) as WebSocket
      },
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      debug: (str) => {
        // STOMP 프레임 로그 (연결 관련만)
        if (str.includes('CONNECT') || str.includes('CONNECTED') || str.includes('SUBSCRIBE') || str.includes('MESSAGE')) {
          debug('[STOMP Frame]', str.substring(0, 200))
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        if (isCleanedUp) {
          debug('연결됐지만 이미 cleanup됨, 무시')
          return
        }

        debug('✅ WebSocket 연결 성공!')
        setIsConnected(true)
        setIsConnecting(false)

        // 메시지 구독
        const messageTopic = `/topic/direct-chats/rooms/${roomUuid}`
        debug('📥 메시지 토픽 구독:', messageTopic)
        const msgSub = client.subscribe(messageTopic, (message: IMessage) => {
          debug('📨 메시지 수신! 전체 body:', message.body)
          try {
            const chatMessage = JSON.parse(message.body) as ChatMessage
            debug('📨 파싱된 메시지 전체:', chatMessage)
            onMessageRef.current?.(chatMessage)
          } catch (e) {
            console.error('메시지 파싱 오류:', e)
          }
        })
        subscriptions.push(msgSub)
        debug('✅ 메시지 구독 완료, subscription id:', msgSub.id)

        // 타이핑 구독
        const typingTopic = `/topic/direct-chats/rooms/${roomUuid}/typing`
        debug('📥 타이핑 토픽 구독:', typingTopic)
        const typingSub = client.subscribe(typingTopic, (message: IMessage) => {
          try {
            const typingStatus = JSON.parse(message.body) as TypingStatus
            onTypingRef.current?.(typingStatus)
          } catch (e) {
            console.error('타이핑 상태 파싱 오류:', e)
          }
        })
        subscriptions.push(typingSub)

        // 에러 구독
        const errorSub = client.subscribe('/user/queue/errors', (message: IMessage) => {
          debug('❌ 에러 수신:', message.body)
          try {
            const error = JSON.parse(message.body)
            onErrorRef.current?.(new Error(error.message || '알 수 없는 오류'))
          } catch (e) {
            console.error('에러 메시지 파싱 오류:', e)
          }
        })
        subscriptions.push(errorSub)

        // 응답 구독 (가이드에 있음)
        const replySub = client.subscribe('/user/queue/reply', (message: IMessage) => {
          debug('📩 응답 수신:', message.body)
        })
        subscriptions.push(replySub)

        // 채팅방 입장 알림
        debug('🚪 채팅방 입장 알림 전송')
        client.publish({
          destination: `/app/direct-chats/rooms/${roomUuid}/enter`,
          body: JSON.stringify({}),
        })

        // 하트비트 시작 (5분 간격)
        heartbeatIntervalRef.current = setInterval(() => {
          if (client.connected) {
            debug('💓 하트비트 전송')
            client.publish({
              destination: '/app/direct-chats/heartbeat',
              body: JSON.stringify({}),
            })
          }
        }, 5 * 60 * 1000)

        onConnectedRef.current?.()
      },

      onDisconnect: () => {
        debug('🔌 WebSocket 연결 해제')
        setIsConnected(false)
        setIsConnecting(false)
        onDisconnectedRef.current?.()
      },

      onStompError: (frame) => {
        debug('❌ STOMP 에러:', frame.headers['message'], frame.body)
        onErrorRef.current?.(new Error(frame.headers['message'] || 'STOMP 연결 오류'))
      },

      onWebSocketError: (event) => {
        debug('❌ WebSocket 에러:', event)
      },

      onWebSocketClose: (event) => {
        debug('🔌 WebSocket 닫힘:', event)
        setIsConnected(false)
        setIsConnecting(false)
      },
    })

    clientRef.current = client
    client.activate()
    debug('⏳ WebSocket 활성화 요청됨')

    // cleanup
    return () => {
      debug('🧹 Cleanup 시작:', roomUuid)
      isCleanedUp = true

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }

      // 구독 해제
      subscriptions.forEach((sub) => {
        try {
          sub.unsubscribe()
        } catch (e) {
          // 무시
        }
      })

      if (client.connected) {
        try {
          client.publish({
            destination: `/app/direct-chats/rooms/${roomUuid}/leave`,
            body: JSON.stringify({}),
          })
        } catch (e) {
          // 무시
        }
      }

      client.deactivate()
      clientRef.current = null
      debug('🧹 Cleanup 완료')
    }
  }, [roomUuid, accessToken]) // roomUuid와 accessToken이 변경될 때

  return {
    isConnected,
    isConnecting,
    reconnect,
    sendMessage,
    sendTyping,
    notifyTyping,
    markAsRead,
  }
}
