/**
 * Rate Limiting with Upstash Redis
 * Implements sliding window algorithm for request throttling
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

interface RateLimitConfig {
  requests: number
  window: number // in seconds
}

const configs: Record<string, RateLimitConfig> = {
  // API routes
  'api.default': { requests: 100, window: 60 }, // 100 requests per minute
  'api.auth': { requests: 10, window: 60 }, // 10 requests per minute for auth endpoints
  'api.search': { requests: 30, window: 60 }, // 30 requests per minute for search
  'api.review': { requests: 5, window: 60 }, // 5 requests per minute for reviews
  'api.order': { requests: 20, window: 60 }, // 20 requests per minute for orders
  'api.upload': { requests: 5, window: 300 }, // 5 uploads per 5 minutes
  // User actions
  'user.login': { requests: 5, window: 300 }, // 5 login attempts per 5 minutes
  'user.register': { requests: 3, window: 3600 }, // 3 registrations per hour
  'user.password-reset': { requests: 3, window: 3600 }, // 3 reset attempts per hour
  'user.review': { requests: 10, window: 86400 }, // 10 reviews per day
  // Vendor actions
  'vendor.product-update': { requests: 50, window: 3600 }, // 50 updates per hour
  'vendor.bulk-upload': { requests: 3, window: 3600 }, // 3 bulk uploads per hour
}

// Cache for rate limit instances
const rateLimiters: Map<string, Ratelimit> = new Map()

/**
 * Get or create a rate limiter for a given key
 */
function getRateLimiter(key: string): Ratelimit {
  if (rateLimiters.has(key)) {
    return rateLimiters.get(key)!
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Upstash Redis credentials not configured')
  }

  const config = configs[key] || configs['api.default']

  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(config.requests, `${config.window}s`),
    analytics: true,
    prefix: `ratelimit:${key}:`,
  })

  rateLimiters.set(key, limiter)
  return limiter
}

/**
 * Check rate limit for IP address
 */
export async function checkIpRateLimit(
  ip: string,
  key: string = 'api.default'
): Promise<{
  allowed: boolean
  limit: number
  remaining: number
  resetAt: Date
}> {
  try {
    const limiter = getRateLimiter(key)
    const result = await limiter.limit(ip)

    return {
      allowed: result.success,
      limit: result.limit,
      remaining: result.remaining,
      resetAt: new Date((result as any).resetAfter || Date.now() + 60000),
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // Allow request if rate limiting fails
    return {
      allowed: true,
      limit: configs[key]?.requests || 100,
      remaining: configs[key]?.requests || 100,
      resetAt: new Date(Date.now() + 60000),
    }
  }
}

/**
 * Check rate limit for user ID
 */
export async function checkUserRateLimit(
  userId: string,
  key: string = 'api.default'
): Promise<{
  allowed: boolean
  limit: number
  remaining: number
  resetAt: Date
}> {
  return checkIpRateLimit(`user:${userId}`, key)
}

/**
 * Check rate limit for email (useful for auth endpoints)
 */
export async function checkEmailRateLimit(
  email: string,
  key: string = 'user.login'
): Promise<{
  allowed: boolean
  limit: number
  remaining: number
  resetAt: Date
}> {
  return checkIpRateLimit(`email:${email}`, key)
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(
  limit: number,
  remaining: number,
  resetAt: Date
): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(Math.max(0, remaining)),
    'X-RateLimit-Reset': String(Math.ceil(resetAt.getTime() / 1000)),
  }
}

/**
 * Batch check rate limits for multiple keys
 */
export async function checkBatchRateLimit(
  identifier: string,
  keys: string[]
): Promise<Record<string, { allowed: boolean; remaining: number }>> {
  const results: Record<string, { allowed: boolean; remaining: number }> = {}

  for (const key of keys) {
    const result = await checkIpRateLimit(identifier, key)
    results[key] = {
      allowed: result.allowed,
      remaining: result.remaining,
    }
  }

  return results
}

/**
 * Reset rate limit for a specific identifier
 * Useful for admin operations
 */
export async function resetRateLimit(identifier: string, key: string): Promise<void> {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.log('Upstash Redis not configured, skipping rate limit reset')
      return
    }

    const redis = Redis.fromEnv()
    const rateLimitKey = `ratelimit:${key}:${identifier}`

    // Delete all keys matching the pattern
    await redis.del(rateLimitKey)
  } catch (error) {
    console.error('Failed to reset rate limit:', error)
  }
}

/**
 * Get rate limit usage statistics
 */
export function getRateLimitConfig(key: string): RateLimitConfig {
  return configs[key] || configs['api.default']
}

/**
 * List all available rate limit configurations
 */
export function listRateLimitConfigs(): Record<string, RateLimitConfig> {
  return { ...configs }
}
