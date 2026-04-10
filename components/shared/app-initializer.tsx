'use client'
import React, { useEffect, useState } from 'react'
import useSettingStore from '@/hooks/use-setting-store'
import { ClientSetting } from '@/types'
import { registerServiceWorker } from '@/hooks/use-pwa'

export default function AppInitializer({
  setting,
  children,
}: {
  setting: ClientSetting
  children: React.ReactNode
}) {
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    setRendered(true)
    // Register PWA service worker
    if (typeof window !== 'undefined') {
      registerServiceWorker().catch((error) => {
        console.warn('Failed to register service worker:', error)
      })
    }
  }, [setting])

  if (!rendered) {
    useSettingStore.setState({
      setting,
    })
  }

  return children
}
