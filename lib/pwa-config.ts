/**
 * PWA Configuration for Next.js Setup
 * 
 * Add to your next.config.ts:
 */

export const pwaConfig = {
  // Service Worker
  experimental: {
    // Enable app router optimizations
    optimizePackageImports: ['@/components', '@/hooks', '@/lib'],
  },

  // Headers for PWA
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/api/manifest',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
      {
        source: '/offline.html',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800',
          },
        ],
      },
    ]
  },

  // Redirects for offline support
  async redirects() {
    return [
      // Redirect manifest requests
      {
        source: '/manifest.json',
        destination: '/api/manifest',
        permanent: false,
      },
    ]
  },
}

/**
 * Add to your app/[locale]/layout.tsx:
 * 
 * Import in the Root Layout Component:
 */

export const layoutMeta = {
  // Add these to your metadata export
  metadataPWA: {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
    manifest: '/api/manifest',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'Amazona',
    },
    icons: [
      {
        rel: 'icon',
        type: 'image/x-icon',
        url: '/images/icons/favicon.ico',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        url: '/images/icons/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        url: '/images/icons/favicon-16x16.png',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        url: '/images/icons/apple-touch-icon.png',
      },
      {
        rel: 'mask-icon',
        url: '/images/icons/safari-pinned-tab.svg',
        color: '#1f2937',
      },
    ],
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: '#ffffff' },
      { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
    ],
    openGraph: {
      type: 'website',
      title: 'Amazona - Multi-Vendor Marketplace',
      description: 'Premium e-commerce platform with real-time tracking and AI recommendations',
      images: [
        {
          url: '/images/og-image.png',
          width: 1200,
          height: 630,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Amazona',
      description: 'Premium e-commerce platform',
      images: ['/images/og-image.png'],
    },
  },
}

/**
 * Root Layout Implementation:
 */

export const layoutExample = `
import { ReactNode } from 'react'
import { PWAInitializer } from '@/components/shared/pwa-initializer'
import { PWAInstallPrompt, OfflineBanner, PWAStatusIndicator } from '@/components/shared/pwa-prompt'
import { layoutMeta } from '@/lib/pwa-config'

export const metadata = {
  ...layoutMeta.metadataPWA,
  // ... other metadata
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  colorScheme: 'light dark',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/api/manifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="msapplication-TileColor" content="#1f2937" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body>
        {/* PWA Setup */}
        <PWAInitializer />
        <PWAInstallPrompt />
        <OfflineBanner />
        <PWAStatusIndicator />

        {/* Your app */}
        {children}
      </body>
    </html>
  )
}
`

/**
 * Usage Examples
 */

export const usageExamples = {
  // Using offline detection in a component
  useOnlineExample: `
import { useOnline } from '@/hooks/use-pwa'

export function MyComponent() {
  const isOnline = useOnline()
  
  return (
    <div>
      {!isOnline && <div>You are offline</div>}
      {isOnline && <div>Connected</div>}
    </div>
  )
}
`,

  // Request notification permission
  notificationExample: `
import { requestNotificationPermission, subscribeToPushNotifications } from '@/hooks/use-pwa'

export function NotificationButton() {
  const handleEnable = async () => {
    const permission = await requestNotificationPermission()
    if (permission === 'granted') {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      await subscribeToPushNotifications(vapidKey)
    }
  }
  
  return <button onClick={handleEnable}>Enable Notifications</button>
}
`,

  // Check if running as PWA
  pwaCheckExample: `
import { useIsPWA } from '@/hooks/use-pwa'

export function MyComponent() {
  const isPWA = useIsPWA()
  
  if (isPWA) {
    return <div>Running as PWA</div>
  }
  
  return <div>Running in browser</div>
}
`,

  // Background sync
  backgroundSyncExample: `
import { registerBackgroundSync } from '@/hooks/use-pwa'

export function CheckoutButton() {
  const handleCheckout = async () => {
    // Create order...
    
    // Register sync to finalize in background if offline
    await registerBackgroundSync('sync-orders')
  }
  
  return <button onClick={handleCheckout}>Checkout</button>
}
`,
}
