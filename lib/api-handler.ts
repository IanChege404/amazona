/**
 * API Route Handler with Rate Limiting and Error Monitoring
 * Wraps API routes with rate limiting, error handling, and Sentry monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkIpRateLimit, createRateLimitHeaders } from '@/lib/rate-limit'

export interface ApiHandlerOptions {
  rateLimit?: string
  auth?: boolean
  adminOnly?: boolean
  vendorOnly?: boolean
}

/**
 * Get client IP from request
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : '0.0.0.0'
  return ip
}

/**
 * Lazy load Sentry only when needed
 */
let Sentry: any = null
const initSentry = async () => {
  if (!Sentry) {
    try {
      Sentry = await import('@sentry/nextjs')
    } catch (e) {
      // Sentry not installed
    }
  }
  return Sentry
}

/**
 * Wrap an API route handler with rate limiting and error handling
 */
export function withApiHandler(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: ApiHandlerOptions
) {
  return async (request: NextRequest) => {
    const ip = getClientIp(request)
    const path = request.nextUrl.pathname

    try {
      // Rate limiting
      if (options?.rateLimit) {
        const rateLimit = await checkIpRateLimit(ip, options.rateLimit)

        if (!rateLimit.allowed) {
          return NextResponse.json(
            {
              error: 'Too many requests',
              retryAfter: Math.ceil(
                (rateLimit.resetAt.getTime() - Date.now()) / 1000
              ),
            },
            {
              status: 429,
              headers: {
                ...createRateLimitHeaders(
                  rateLimit.limit,
                  rateLimit.remaining,
                  rateLimit.resetAt
                ),
                'Retry-After': String(
                  Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)
                ),
              },
            }
          )
        }

        // Add rate limit headers to response
        request.headers.set('X-RateLimit-Limit', String(rateLimit.limit))
        request.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining))
        request.headers.set('X-RateLimit-Reset', String(rateLimit.resetAt.getTime() / 1000))
      }

      // Start Sentry transaction
      await initSentry()
      const transaction = Sentry?.startTransaction?.({
        name: `${request.method} ${path}`,
        op: 'http.request',
      })

      // Add request context
      Sentry?.setTag?.('client_ip', ip)
      Sentry?.setTag?.('method', request.method)

      // Call the handler
      const response = await handler(request)

      // Add error tags if response is error
      if (response.status >= 400) {
        Sentry?.setTag?.('response_status', response.status)
      }

      transaction?.finish?.()
      return response
    } catch (error) {
      // Capture error in Sentry
      await initSentry()
      Sentry?.captureException?.(error, {
        tags: {
          api_path: path,
          client_ip: ip,
          component: 'api-handler',
        },
      })

      // Return error response
      return NextResponse.json(
        {
          error: 'Internal server error',
          ...(process.env.NODE_ENV === 'development' && {
            message: error instanceof Error ? error.message : String(error),
          }),
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Create a simple rate-limited API response
 */
export async function createRateLimitedResponse(
  ip: string,
  rateLimit: string = 'api.default'
): Promise<NextResponse | null> {
  const limit = await checkIpRateLimit(ip, rateLimit)

  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        retryAfter: Math.ceil((limit.resetAt.getTime() - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          ...createRateLimitHeaders(limit.limit, limit.remaining, limit.resetAt),
          'Retry-After': String(
            Math.ceil((limit.resetAt.getTime() - Date.now()) / 1000)
          ),
        },
      }
    )
  }

  return null
}

/**
 * Extract pagination parameters from request
 */
export function getPaginationParams(req: NextRequest): {
  page: number
  limit: number
} {
  const page = Math.max(1, Number(req.nextUrl.searchParams.get('page')) || 1)
  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get('limit')) || 20))

  return { page, limit }
}

/**
 * Extract filter parameters from request
 */
export function getFilterParams(
  req: NextRequest,
  keys: string[]
): Record<string, string | null> {
  const filters: Record<string, string | null> = {}

  for (const key of keys) {
    filters[key] = req.nextUrl.searchParams.get(key)
  }

  return filters
}

/**
 * Create a paginated API response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  const pages = Math.ceil(total / limit)
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasMore: page < pages,
    },
  }
}
