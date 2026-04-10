'use client'

import { useEffect, useRef } from 'react'
import { registerServiceWorker, requestNotificationPermission } from '@/hooks/use-pwa'

/**
 * PWA Initializer Component
 * Registers service worker and sets up push notifications
 * Should be rendered once in root layout
 */
export function PWAInitializer() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Register service worker
    const setupPWA = async () => {
      // Register SW
      await registerServiceWorker()

      // Request notification permission if user granted it before
      if (Notification.permission === 'default') {
        // Auto-request only in production
        if (process.env.NODE_ENV === 'production') {
          // Can be triggered by user action instead
          // await requestNotificationPermission()
        }
      }
    }

    setupPWA()
  }, [])

  return null
}
