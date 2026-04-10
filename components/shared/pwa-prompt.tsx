'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePWAInstall, getIOSInstallPrompt, isIOS } from '@/hooks/use-pwa'

/**
 * PWA Install Prompt Component
 * Shows installation prompts for Android and iOS
 */
export function PWAInstallPrompt() {
  const { isInstalled, showPrompt, install, dismiss } = usePWAInstall()
  const [isIOSDevice, setIsIOSDevice] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setIsIOSDevice(isIOS())

    // Check localStorage for dismissal
    const wasDismissed = localStorage.getItem('pwa-prompt-dismissed')
    if (wasDismissed) {
      setDismissed(true)
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('pwa-prompt-dismissed', 'true')
    dismiss()
  }

  const handleInstall = async () => {
    await install()
    setDismissed(true)
  }

  // Don't show if installed or dismissed
  if (isInstalled || dismissed || (!showPrompt && !isIOSDevice)) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-4 shadow-2xl">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="hidden flex-shrink-0 sm:block">
            <svg
              className="h-8 w-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              Install Amazona App
            </p>
            <p className="mt-1 text-xs text-blue-100">
              {isIOSDevice
                ? getIOSInstallPrompt()
                : 'Get quick access and offline support. Install our app today!'}
            </p>
          </div>
        </div>

        <div className="flex flex-shrink-0 gap-2">
          {!isIOSDevice && (
            <Button
              onClick={handleInstall}
              className="bg-white text-blue-600 hover:bg-blue-50"
              size="sm"
            >
              Install
            </Button>
          )}
          <Button
            onClick={handleDismiss}
            variant="ghost"
            className="text-white hover:bg-blue-600"
            size="sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Offline Banner Component
 * Shows when device is offline
 */
export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowBanner(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowBanner(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline || !showBanner) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 px-4 py-3">
      <div className="mx-auto flex max-w-2xl items-center gap-3">
        <svg
          className="h-5 w-5 text-white flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
        </svg>
        <p className="text-sm font-medium text-white">
          You are offline. Some features may not be available, but you can still browse cached content.
        </p>
      </div>
    </div>
  )
}

/**
 * PWA Status Indicator Component
 * Shows PWA status for debugging/info
 */
export function PWAStatusIndicator() {
  const [status, setStatus] = useState<{
    installed: boolean
    online: boolean
    swRegistered: boolean
  }>({
    installed: false,
    online: navigator.onLine,
    swRegistered: false,
  })

  useEffect(() => {
    // Check SW registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        setStatus((prev) => ({ ...prev, swRegistered: registrations.length > 0 }))
      })
    }

    // Check online status
    const handleOnline = () => setStatus((prev) => ({ ...prev, online: true }))
    const handleOffline = () => setStatus((prev) => ({ ...prev, online: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const isDev = process.env.NODE_ENV === 'development'

  if (!isDev) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 text-xs">
      <div className="rounded-lg bg-slate-900 p-3 text-white shadow-lg">
        <p className="font-mono">
          <span className={status.online ? 'text-green-400' : 'text-red-400'}>
            ● {status.online ? 'Online' : 'Offline'}
          </span>
        </p>
        <p className="font-mono">
          <span className={status.swRegistered ? 'text-green-400' : 'text-yellow-400'}>
            ● {status.swRegistered ? 'SW Active' : 'SW Inactive'}
          </span>
        </p>
      </div>
    </div>
  )
}
