'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Client, StompSubscription } from '@stomp/stompjs'
import { useAuthStore } from '@/stores/authStore'
import type { Notification } from '@/types/notification'

// SockJS를 클라이언트 사이드에서만 import
let SockJS: any = null
if (typeof window !== 'undefined') {
  SockJS = require('sockjs-client')
}

interface UseNotificationWebSocketOptions {
  onNotificationReceived?: (notification: Notification) => void
  onUnreadCountChanged?: (count: number) => void
  enabled?: boolean
}

export function useNotificationWebSocket({
  onNotificationReceived,
  onUnreadCountChanged,
  enabled = true,
}: UseNotificationWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const clientRef = useRef<Client | null>(null)
  const subscriptionRef = useRef<StompSubscription | null>(null)
  const accessToken = useAuthStore((state) => state.accessToken)

  // WebSocket 연결
  const connect = useCallback(() => {
    if (!enabled || !accessToken || !SockJS || clientRef.current?.connected) {
      return
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    const wsUrl = `${baseUrl}/ws`
    console.log('🔌 [WebSocket] 연결 중...')

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl) as WebSocket,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      // STOMP 내부 디버그 끄기 (필요시 활성화)
      debug: () => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    })

    client.onConnect = () => {
      console.log('✅ [WebSocket] 연결 성공')
      setIsConnected(true)

      // 알림 구독
      if (client.connected) {
        subscriptionRef.current = client.subscribe('/user/queue/notifications', (message) => {
          try {
            const data = JSON.parse(message.body)

            // 새 알림 수신
            if (data.type === 'NEW_NOTIFICATION' && onNotificationReceived) {
              console.log('🔔 새 알림:', data.notification.title)
              onNotificationReceived(data.notification)
            }

            // 미읽음 개수 변경
            if (data.type === 'UNREAD_COUNT_CHANGED' && onUnreadCountChanged) {
              console.log('📊 미읽음 개수:', data.unreadCount)
              onUnreadCountChanged(data.unreadCount)
            }
          } catch (error) {
            console.error('❌ [WebSocket] 메시지 파싱 실패:', error)
          }
        })
        console.log('✅ [WebSocket] 알림 구독 완료')
      }
    }

    client.onDisconnect = () => {
      console.log('⚠️ [WebSocket] 연결 해제')
      setIsConnected(false)
    }

    client.onStompError = (frame) => {
      console.error('❌ [WebSocket] 에러:', frame.headers['message'])
      setIsConnected(false)
    }

    client.activate()
    clientRef.current = client
  }, [enabled, accessToken, onNotificationReceived, onUnreadCountChanged])

  // WebSocket 연결 해제
  const disconnect = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }

    if (clientRef.current) {
      clientRef.current.deactivate()
      clientRef.current = null
    }

    setIsConnected(false)
  }, [])

  // 알림 읽음 처리 (WebSocket으로 전송)
  const markAsRead = useCallback((uuid: string) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: `/app/notifications/${uuid}/read`,
      })
    }
  }, [])

  // 미읽음 개수 조회 (WebSocket으로 요청)
  const requestUnreadCount = useCallback(() => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: '/app/notifications/unread-count',
      })
    }
  }, [])

  // 알림 목록 조회 (WebSocket으로 요청)
  const requestNotifications = useCallback((page: number = 0, size: number = 10) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: '/app/notifications/list',
        body: JSON.stringify({ page, size }),
      })
    }
  }, [])

  // 자동 연결/해제
  useEffect(() => {
    if (enabled && accessToken) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, accessToken, connect, disconnect])

  return {
    isConnected,
    connect,
    disconnect,
    markAsRead,
    requestUnreadCount,
    requestNotifications,
  }
}
