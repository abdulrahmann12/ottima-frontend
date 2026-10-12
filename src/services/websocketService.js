import useAuthStore from '@/store/authStore'
import useNotificationStore from '@/store/useNotificationStore'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

let stompClient = null
let toastCallback = null
const customSubscriptions = new Map()
let nextSubId = 1

/**
 * Register toast callback for incoming real-time notifications
 */
export function setNotificationToastCallback(cb) {
  toastCallback = cb
}

/**
 * Subscribe to an arbitrary STOMP destination (e.g. /topic/projects/{projectId}/chat)
 * Resilient to reconnections and delayed connection initialization.
 *
 * @param {string} destination STOMP destination
 * @param {Function} callback Handler callback receiving parsed payload
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTopic(destination, callback) {
  if (!destination || typeof callback !== 'function') {
    return () => {}
  }

  const id = nextSubId++
  const subObj = {
    destination,
    callback,
    stompSub: null,
  }
  customSubscriptions.set(id, subObj)

  if (stompClient && stompClient.connected) {
    try {
      subObj.stompSub = stompClient.subscribe(destination, (message) => {
        try {
          const payload = JSON.parse(message.body)
          callback(payload)
        } catch (err) {
          console.error(`Failed to parse STOMP message on ${destination}:`, err)
        }
      })
    } catch (err) {
      console.error(`Error subscribing to ${destination}:`, err)
    }
  }

  return () => {
    if (subObj.stompSub) {
      try {
        subObj.stompSub.unsubscribe()
      } catch {
        // Ignore
      }
      subObj.stompSub = null
    }
    customSubscriptions.delete(id)
  }
}

/**
 * Connect to Spring Boot STOMP WebSocket (/ws) endpoint
 * Subscribes to /queue/notifications-{userId} and any registered topics
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
      // 1. Subscribe to personal in-app notifications
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

      // 2. Resubscribe any registered custom topic subscriptions
      customSubscriptions.forEach((subObj) => {
        try {
          if (subObj.stompSub) {
            try {
              subObj.stompSub.unsubscribe()
            } catch {
              // Ignore
            }
          }
          subObj.stompSub = stompClient.subscribe(subObj.destination, (message) => {
            try {
              const payload = JSON.parse(message.body)
              subObj.callback(payload)
            } catch (err) {
              console.error(`Failed to parse STOMP message on ${subObj.destination}:`, err)
            }
          })
        } catch (err) {
          console.error(`Error resubscribing to ${subObj.destination}:`, err)
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
  customSubscriptions.forEach((subObj) => {
    if (subObj.stompSub) {
      try {
        subObj.stompSub.unsubscribe()
      } catch {
        // Ignore
      }
      subObj.stompSub = null
    }
  })
  if (stompClient) {
    try {
      stompClient.deactivate()
    } catch {
      // Ignore
    }
    stompClient = null
  }
}
