/**
 * Rate Limit Status API
 * Shows current rate limit quotas and usage
 */

import { NextRequest, NextResponse } from 'next/server'
import { getClientIp } from '@/lib/api-handler'
import { checkIpRateLimit, createRateLimitHeaders } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const keys = [
    'api.default',
    'api.auth',
    'api.search',
    'api.review',
    'api.order',
  ]

  try {
    const limits: Record<string, any> = {}

    for (const key of keys) {
      const limit = await checkIpRateLimit(ip, key)
      limits[key] = {
        allowed: limit.allowed,
        limit: limit.limit,
        remaining: limit.remaining,
        resetAt: limit.resetAt.toISOString(),
      }
    }

    const response = NextResponse.json(
      {
        clientIp: ip,
        limits,
      },
      {
        status: 200,
      }
    )

    // Add rate limit headers
    const defaultLimit = await checkIpRateLimit(ip, 'api.default')
    for (const [key, value] of Object.entries(
      createRateLimitHeaders(defaultLimit.limit, defaultLimit.remaining, defaultLimit.resetAt)
    )) {
      response.headers.set(key, value)
    }

    return response
  } catch (error) {
    console.error('Failed to fetch rate limits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rate limits' },
      { status: 500 }
    )
  }
}
