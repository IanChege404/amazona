/**
 * Sentry Configuration for Error Monitoring
 * Tracks errors, performance metrics, and user sessions
 * 
 * Note: Requires @sentry/nextjs package installed
 * npm install @sentry/nextjs
 */

// Dynamic import to avoid build errors if package not installed
let Sentry: any = null

const initSentry = async () => {
  try {
    Sentry = await import('@sentry/nextjs')
  } catch (e) {
    console.log('[SENTRY] Package not installed')
  }
}

export async function initializeSentry() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.log('[SENTRY] DSN not configured, skipping initialization')
    return
  }
  
  await initSentry()
  
  if (!Sentry) {
    console.log('[SENTRY] Package not available')
    return
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    enabled: !!process.env.SENTRY_AUTH_TOKEN,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',

    // Integrations
    integrations: [
      Sentry.captureConsoleIntegration({
        levels: ['error', 'warn'],
      }),
      Sentry.httpClientIntegration({
        failedRequestStatusCodes: [401, 403, 404, 500, 502, 503, 504],
      }),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
        maskAllInputs: true,
      }),
    ],

    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Before sending
    beforeSend(event: any) {
      // Filter out health check requests
      if (event?.request?.url?.includes('/api/health')) {
        return null
      }

      // Add custom context
      if (event?.exception) {
        event.tags = event.tags || {}
        event.tags['error_type'] = 'exception'
      }

      return event
    },

    // Ignore patterns
    ignoreErrors: [
      // Browser errors
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      // Random plugins/extensions
      'chrome://',
      'firefox-extension://',
      'moz-extension://',
      // ISP-level filtering
      'Network request failed',
    ],
  })
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(userId?: string, email?: string, username?: string) {
  if (!Sentry?.setUser) return
  Sentry.setUser({
    id: userId,
    email,
    username,
  })
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
  if (!Sentry?.setUser) return
  Sentry.setUser(null)
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addSentryBreadcrumb(
  message: string,
  data?: Record<string, any>,
  category?: string,
  level?: 'info' | 'warning' | 'error'
) {
  if (!Sentry?.addBreadcrumb) return
  Sentry.addBreadcrumb({
    message,
    data,
    category: category || 'user-action',
    level: level || 'info',
  })
}

/**
 * Capture an exception
 */
export function captureException(error: Error | unknown, context?: Record<string, any>) {
  if (!Sentry?.captureException) return
  Sentry.captureException(error, {
    contexts: {
      app: context,
    },
  })
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug'
) {
  if (!Sentry?.captureMessage) return
  Sentry.captureMessage(message, level || 'info')
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(name: string, op?: string) {
  if (!Sentry?.startTransaction) return null
  return Sentry.startTransaction({
    name,
    op: op || 'http.request',
  })
}

/**
 * Monitor an async function
 */
export async function withSentryMonitoring<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  const transaction = startTransaction(operation)

  try {
    const result = await fn()
    transaction?.finish?.()
    return result
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), context)
    transaction?.finish?.()
    throw error
  }
}
