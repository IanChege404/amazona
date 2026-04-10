/**
 * Service Worker for PWA
 * Handles caching, offline support, and push notifications
 * 
 * This file runs in a separate context and cannot import Next.js modules
 * Place in public/ directory as public/sw.js
 */

const CACHE_NAME = 'amazona-v1'
const STATIC_CACHE = 'amazona-static-v1'
const RUNTIME_CACHE = 'amazona-runtime-v1'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

/**
 * Install event - cache essential files
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker')

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(STATIC_CACHE)
        await cache.addAll(STATIC_ASSETS)
        console.log('[SW] Static assets cached')
        self.skipWaiting()
      } catch (error) {
        console.error('[SW] Install failed:', error)
      }
    })()
  )
})

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker')

  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map((name) => {
          if (name !== STATIC_CACHE && name !== RUNTIME_CACHE && !name.startsWith('amazona-')) {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          }
        })
      )
      self.clients.claim()
      console.log('[SW] Service worker activated')
    })()
  )
})

/**
 * Fetch event - implement caching strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignore non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Ignore API calls - let them fail gracefully
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline.html') || new Response('Offline', { status: 503 })
      })
    )
    return
  }

  // Strategy for HTML pages - network first, then cache
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request)
          if (response.ok) {
            const cache = await caches.open(RUNTIME_CACHE)
            cache.put(request, response.clone())
          }
          return response
        } catch (error) {
          const cached = await caches.match(request)
          if (cached) {
            return cached
          }
          return caches.match('/offline.html') || new Response('Offline', { status: 503 })
        }
      })()
    )
    return
  }

  // Strategy for assets - cache first, then network
  if (
    request.headers.get('accept')?.includes('image') ||
    request.url.includes('/images/') ||
    request.url.includes('/fonts/')
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request)
        if (cached) {
          return cached
        }

        try {
          const response = await fetch(request)
          if (response.ok) {
            const cache = await caches.open(RUNTIME_CACHE)
            cache.put(request, response.clone())
          }
          return response
        } catch (error) {
          return new Response(null, { status: 404 })
        }
      })()
    )
    return
  }

  // Default strategy - network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const cache = caches.open(RUNTIME_CACHE).then((c) => {
            c.put(request, response.clone())
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(request)
      })
  )
})

/**
 * Message event - handle messages from clients
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)

  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    caches.delete(RUNTIME_CACHE).then(() => {
      console.log('[SW] Runtime cache cleared')
    })
  }

  if (event.data?.type === 'CACHE_URLS') {
    const { urls } = event.data
    caches.open(RUNTIME_CACHE).then((cache) => {
      cache.addAll(urls)
    })
  }
})

/**
 * Background sync - sync data when online
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)

  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders())
  }

  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart())
  }
})

/**
 * Push notification event
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')

  if (!event.data) {
    console.log('[SW] Push event with no data')
    return
  }

  let notificationData = {
    title: 'Amazona',
    body: 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'amazona-notification',
  }

  try {
    const data = event.data.json()
    notificationData = { ...notificationData, ...data }
  } catch (e) {
    notificationData.body = event.data.text()
  }

  event.waitUntil(self.registration.showNotification(notificationData.title, notificationData))
})

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked')
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (let client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window if not found
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

/**
 * Sync orders with server
 */
async function syncOrders() {
  try {
    const response = await fetch('/api/orders/sync', { method: 'POST' })
    if (!response.ok) {
      throw new Error('Sync failed')
    }
    console.log('[SW] Orders synced successfully')
  } catch (error) {
    console.error('[SW] Failed to sync orders:', error)
    throw error // Retry
  }
}

/**
 * Sync cart with server
 */
async function syncCart() {
  try {
    const response = await fetch('/api/cart/sync', { method: 'POST' })
    if (!response.ok) {
      throw new Error('Sync failed')
    }
    console.log('[SW] Cart synced successfully')
  } catch (error) {
    console.error('[SW] Failed to sync cart:', error)
    throw error // Retry
  }
}
