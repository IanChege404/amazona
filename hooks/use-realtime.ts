'use client'

import { useEffect, useState, useCallback } from 'react'
import PusherClient from 'pusher-js'

// Client-side Pusher instance
let pusherClientInstance: PusherClient | null = null

/**
 * Get or create the Pusher client instance
 */
function getPusherClient(): PusherClient {
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY || '',
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
        channelAuthorization: {
          transport: 'ajax',
          endpoint: '/api/pusher/auth',
        },
      }
    )
  }
  return pusherClientInstance
}

export interface UseOrderTrackerOptions {
  orderId: string
  enabled?: boolean
}

export interface OrderStatus {
  status: string
  message: string
  timestamp: string
}

/**
 * Hook for real-time order status tracking
 */
export function useOrderTracker(options: UseOrderTrackerOptions) {
  const { orderId, enabled = true } = options
  const [status, setStatus] = useState<OrderStatus | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!enabled || !orderId) return

    try {
      const pusher = getPusherClient()
      const channelName = `order-${orderId}`

      // Subscribe to public order channel
      const channel = pusher.subscribe(channelName)

      // Listen for status updates
      channel.bind('status-updated', (data: OrderStatus) => {
        setStatus(data)
      })

      // Track connection status
      pusher.connection.bind('connected', () => {
        setIsConnected(true)
      })

      pusher.connection.bind('disconnected', () => {
        setIsConnected(false)
      })

      return () => {
        pusher.unsubscribe(channelName)
      }
    } catch (error) {
      console.error('Order tracker error:', error)
    }
  }, [orderId, enabled])

  return { status, isConnected }
}

/**
 * Hook for vendor private notifications
 */
export interface Notification {
  id?: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: string
}

export function useVendorNotifications(vendorId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!vendorId) return

    try {
      const pusher = getPusherClient()
      const channelName = `private-vendor-${vendorId}`

      // Subscribe to private vendor channel
      const channel = pusher.subscribe(channelName)

      // Listen for notifications
      channel.bind('notification', (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev.slice(0, 9)])
      })

      // Track connection status
      pusher.connection.bind('connected', () => {
        setIsConnected(true)
      })

      pusher.connection.bind('disconnected', () => {
        setIsConnected(false)
      })

      return () => {
        pusher.unsubscribe(channelName)
      }
    } catch (error) {
      console.error('Vendor notifications error:', error)
    }
  }, [vendorId])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return { notifications, isConnected, clearNotifications }
}

/**
 * Hook for user private notifications
 */
export function useUserNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!userId) return

    try {
      const pusher = getPusherClient()
      const channelName = `private-user-${userId}`

      // Subscribe to private user channel
      const channel = pusher.subscribe(channelName)

      // Listen for notifications
      channel.bind('notification', (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev.slice(0, 9)])
      })

      // Track connection status
      pusher.connection.bind('connected', () => {
        setIsConnected(true)
      })

      pusher.connection.bind('disconnected', () => {
        setIsConnected(false)
      })

      return () => {
        pusher.unsubscribe(channelName)
      }
    } catch (error) {
      console.error('User notifications error:', error)
    }
  }, [userId])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return { notifications, isConnected, clearNotifications }
}
