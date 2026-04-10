/* eslint-disable @typescript-eslint/no-explicit-any */
import Pusher from 'pusher'

/**
 * Pusher server instance for triggering real-time events
 * Used for order status updates, notifications, etc.
 */
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.PUSHER_CLUSTER || 'mt1',
  useTLS: true,
})

/**
 * Trigger an event on a channel
 */
export async function triggerPusherEvent(
  channel: string,
  event: string,
  data: Record<string, any>
) {
  try {
    if (!process.env.PUSHER_APP_ID) {
      console.warn('Pusher not configured. Real-time updates will be unavailable.')
      return false
    }

    await pusherServer.trigger(channel, event, {
      ...data,
      timestamp: new Date().toISOString(),
    })
    return true
  } catch (error) {
    console.error(`Failed to trigger Pusher event on ${channel}:`, error)
    return false
  }
}

/**
 * Trigger a private event (for specific users)
 */
export async function triggerPrivateEvent(
  userId: string,
  event: string,
  data: Record<string, any>
) {
  return triggerPusherEvent(`private-user-${userId}`, event, data)
}

/**
 * Trigger an order status update event
 */
export async function triggerOrderStatusUpdate(
  orderId: string,
  status: string,
  message: string
) {
  return triggerPusherEvent(`order-${orderId}`, 'status-updated', {
    status,
    message,
  })
}

/**
 * Trigger a vendor notification
 */
export async function triggerVendorNotification(
  vendorId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) {
  return triggerPrivateEvent(`vendor-${vendorId}`, 'notification', {
    title,
    message,
    type,
  })
}
