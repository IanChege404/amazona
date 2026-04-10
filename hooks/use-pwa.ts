/**
 * PWA Utilities and Hooks
 * Client-side service worker registration and PWA features
 */

import { useEffect, useState, useCallback } from 'react'

interface PWAInstallPrompt extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service Worker not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
    console.log('[PWA] Service Worker registered:', registration)

    // Check for updates periodically
    setInterval(() => {
      registration.update()
    }, 60000) // Check every minute

    return registration
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error)
    return null
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const registration of registrations) {
      await registration.unregister()
    }
    console.log('[PWA] Service Workers unregistered')
    return true
  } catch (error) {
    console.error('[PWA] Failed to unregister:', error)
    return false
  }
}

/**
 * Check if app is installed
 */
export async function isAppInstalled(): Promise<boolean> {
  if (!('getInstalledRelatedApps' in navigator)) {
    return false
  }

  try {
    const apps = await (navigator as any).getInstalledRelatedApps?.()
    return apps?.length > 0
  } catch (error) {
    console.error('[PWA] Failed to check installed apps:', error)
    return false
  }
}

/**
 * Hook for PWA installation
 */
export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as PWAInstallPrompt)
      setShowPrompt(true)
    }

    const handleAppInstalled = () => {
      console.log('[PWA] App installed')
      setIsInstalled(true)
      setShowPrompt(false)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check if app is already installed
    isAppInstalled().then(setIsInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!installPrompt) return

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('[PWA] Installation accepted')
        setShowPrompt(false)
      } else {
        console.log('[PWA] Installation rejected')
      }
    } catch (error) {
      console.error('[PWA] Installation failed:', error)
    }
  }, [installPrompt])

  const dismiss = useCallback(() => {
    setShowPrompt(false)
  }, [])

  return { installPrompt, isInstalled, showPrompt, install, dismiss }
}

/**
 * Hook for offline detection
 */
export function useOnline() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      console.log('[PWA] Online')
    }

    const handleOffline = () => {
      setIsOnline(false)
      console.log('[PWA] Offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Set initial state
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

/**
 * Check if running as PWA
 */
export function useIsPWA(): boolean {
  const [isPWA, setIsPWA] = useState(false)

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches

    setIsPWA(isStandalone || /iphone|ipad|ipod/.test(userAgent))
  }, [])

  return isPWA
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('[PWA] Notifications not supported')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission()
  }

  return 'denied'
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('[PWA] Push notifications not supported')
      return null
    }

    const registration = await navigator.serviceWorker.ready

    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any,
      })

      console.log('[PWA] Subscribed to push notifications')

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      })
    }

    return subscription
  } catch (error) {
    console.error('[PWA] Failed to subscribe to push:', error)
    return null
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator)) {
      return false
    }

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
      console.log('[PWA] Unsubscribed from push notifications')
      return true
    }

    return false
  } catch (error) {
    console.error('[PWA] Failed to unsubscribe:', error)
    return false
  }
}

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

/**
 * Register for background sync
 */
export async function registerBackgroundSync(tag: string): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Background sync not supported')
      return false
    }

    const registration = await navigator.serviceWorker.ready
    
    // Check if SyncManager is available
    if (!('sync' in registration)) {
      console.log('[PWA] Background sync not supported in this browser')
      return false
    }

    await (registration as any).sync.register(tag)
    console.log(`[PWA] Background sync registered: ${tag}`)
    return true
  } catch (error) {
    console.error('[PWA] Failed to register background sync:', error)
    return false
  }
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
}

/**
 * Show iOS installation prompt
 */
export function getIOSInstallPrompt(): string {
  return 'To install this app on your iOS device, tap Share and then "Add to Home Screen".'
}
