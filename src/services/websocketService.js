import useAuthStore from '@/store/authStore'
import useNotificationStore from '@/store/useNotificationStore'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

let stompClient = null
let toastCallback = null

/**
 * Register toast callback for incoming real-time notifications
 */
export function setNotificationToastCallback(cb) {
  toastCallback = cb
}

/**
 * Connect to Spring Boot STOMP WebSocket (/ws) endpoint
 * Subscribes to /queue/notifications-{userId}
 *
 * @param {string|number} userId User ID
 */
export function connectWebSocket(userId) {
  if (!userId) return

  disconnectWebSocket()

  const { accessToken } = useAuthStore.getState()
  const wsEndpoint = BASE_URL ? `${BASE_URL}/ws` : `${window.location.origin}/ws`

  try {
    stompClient = new Client({
      webSocketFactory: () => new SockJS(wsEndpoint),
      connectHeaders: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
    })

    stompClient.onConnect = () => {
      const queueDestination = `/queue/notifications-${userId}`

      stompClient.subscribe(queueDestination, (message) => {
        try {
          const payload = JSON.parse(message.body)
          useNotificationStore.getState().addRealTimeNotification(payload)

          if (typeof toastCallback === 'function') {
            toastCallback(payload)
          }
        } catch (err) {
          console.error('Failed to parse STOMP notification payload:', err)
        }
      })
    }

    stompClient.onStompError = () => {
      // Silently handle STOMP errors
    }

    stompClient.activate()
  } catch (err) {
    console.error('WebSocket connection error:', err)
  }
}

/**
 * Disconnect WebSocket client
 */
export function disconnectWebSocket() {
  if (stompClient) {
    try {
      stompClient.deactivate()
    } catch {
      // Ignore
    }
    stompClient = null
  }
}
