/**
 * Server initialization for monitoring
 * Should be loaded in instrumentation.ts for Next.js 15
 */

let Sentry: any = null

const loadSentry = async () => {
  if (!Sentry) {
    try {
      Sentry = await import('@sentry/nextjs')
    } catch (e) {
      console.log('[MONITORING] Sentry package not installed')
    }
  }
  return Sentry
}

export async function initializeMonitoring() {
  // Initialize Sentry only if DSN is configured
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.log('[MONITORING] Sentry DSN not configured, skipping initialization')
    return
  }

  const S = await loadSentry()
  if (!S) {
    console.log('[MONITORING] Sentry not available')
    return
  }

  S.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      Sentry.captureConsoleIntegration({
        levels: ['error', 'warn'],
      }),
      Sentry.httpClientIntegration({
        failedRequestStatusCodes: [401, 403, 404, 500, 502, 503, 504],
      }),
    ],

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',

    // Ignore patterns
    ignoreErrors: [
      'top.GLOBALS',
      'NetworkError',
      'Network request failed',
      'timeout of',
      'Non-Error promise rejection detected',
    ],
  })

  console.log('[MONITORING] Sentry initialized successfully')
}

/**
 * Monitor API route performance
 */
export async function monitorApiRoute(name: string, duration: number, status: number) {
  const S = await loadSentry()
  if (!S?.isInitialized?.()) return

  const transaction = S.startTransaction?.({
    name: `API ${name}`,
    op: 'http.request',
  })

  if (status >= 400) {
    S.setTag?.('error_response', true)
    S.setTag?.('status_code', status)
  }

  transaction?.finish?.()
}

/**
 * Monitor database operations
 */
export async function monitorDatabaseOp(op: string, collection: string, duration: number) {
  const S = await loadSentry()
  if (!S?.isInitialized?.()) return

  const transaction = S.startTransaction?.({
    name: `DB ${op} [${collection}]`,
    op: 'db.operation',
  })

  if (duration > 1000) {
    S.setTag?.('slow_query', true)
    S.setTag?.('duration_ms', duration)
  }

  transaction?.finish?.()

}
