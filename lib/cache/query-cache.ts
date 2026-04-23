/**
 * Redis Caching Utilities
 * Query result caching with TTL and stale-while-revalidate support
 * Uses Upstash Redis for serverless environments
 */

'use server'

import { Redis } from '@upstash/redis'

// Initialize Upstash Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

export interface CacheOptions {
  ttl?: number // Time to live in seconds (default: 300)
  staleTime?: number // Serve stale data for this long after expiry
  namespace?: string // Cache key namespace/prefix
  tags?: string[] // Cache invalidation tags
}

/**
 * Get cached query result or execute query and cache result
 */
export async function getCachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 300, staleTime = 600, namespace = 'query' } = options

  if (!redis) {
    // Redis not configured, skip caching
    return queryFn()
  }

  const cacheKey = `${namespace}:${key}`

  try {
    // Try to get from cache
    const cached = await redis.get<T>(cacheKey)
    if (cached) {
      console.log(`[CACHE] Hit: ${cacheKey}`)
      return cached
    }
  } catch (error) {
    console.warn(`[CACHE] Get failed: ${cacheKey}`, error)
    // Continue without cache on error
  }

  try {
    // Execute query
    const result = await queryFn()

    // Cache result
    await redis.setex(cacheKey, ttl, JSON.stringify(result))
    console.log(`[CACHE] Set: ${cacheKey} (TTL: ${ttl}s)`)

    return result
  } catch (error) {
    console.error(`[CACHE] Query failed: ${cacheKey}`, error)
    throw error
  }
}

/**
 * Get stale-while-revalidate cache (serve stale + revalidate in background)
 * Useful for data that doesn't need to be fresh immediately
 */
export async function getCachedQuerySWR<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<{ data: T; isStale: boolean }> {
  const { ttl = 300, staleTime = 600, namespace = 'query' } = options

  if (!redis) {
    const data = await queryFn()
    return { data, isStale: false }
  }

  const cacheKey = `${namespace}:${key}`
  const staleCacheKey = `${cacheKey}:stale`

  try {
    // Try fresh cache first
    const fresh = await redis.get<T>(cacheKey)
    if (fresh) {
      console.log(`[SWR] Fresh hit: ${cacheKey}`)
      return { data: fresh, isStale: false }
    }

    // Try stale cache
    const stale = await redis.get<T>(staleCacheKey)
    if (stale) {
      console.log(`[SWR] Stale hit: ${cacheKey}`)

      // Revalidate in background (don't await)
      revalidateQueryBackground(key, queryFn, options).catch((err) => {
        console.error(`[SWR] Background revalidation failed: ${cacheKey}`, err)
      })

      return { data: stale, isStale: true }
    }
  } catch (error) {
    console.warn(`[SWR] Cache get failed: ${cacheKey}`, error)
  }

  // No cache, execute query
  try {
    const result = await queryFn()

    // Cache fresh and stale versions
    await Promise.all([
      redis.setex(cacheKey, ttl, JSON.stringify(result)),
      redis.setex(staleCacheKey, staleTime, JSON.stringify(result)),
    ])

    console.log(`[SWR] Set: ${cacheKey} (TTL: ${ttl}s, Stale: ${staleTime}s)`)
    return { data: result, isStale: false }
  } catch (error) {
    console.error(`[SWR] Query failed: ${cacheKey}`, error)
    throw error
  }
}

/**
 * Revalidate cache in background without blocking
 */
async function revalidateQueryBackground<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: CacheOptions
) {
  const { ttl = 300, staleTime = 600, namespace = 'query' } = options
  const cacheKey = `${namespace}:${key}`
  const staleCacheKey = `${cacheKey}:stale`

  try {
    const result = await queryFn()

    await Promise.all([
      redis?.setex(cacheKey, ttl, JSON.stringify(result)),
      redis?.setex(staleCacheKey, staleTime, JSON.stringify(result)),
    ])

    console.log(`[SWR] Background revalidated: ${cacheKey}`)
  } catch (error) {
    console.error(`[SWR] Background revalidation error: ${cacheKey}`, error)
    throw error
  }
}

/**
 * Invalidate specific cache key
 */
export async function invalidateCache(key: string, namespace: string = 'query') {
  if (!redis) return

  const cacheKey = `${namespace}:${key}`
  const staleCacheKey = `${cacheKey}:stale`

  try {
    await Promise.all([redis.del(cacheKey), redis.del(staleCacheKey)])
    console.log(`[CACHE] Invalidated: ${cacheKey}`)
  } catch (error) {
    console.error(`[CACHE] Invalidation failed: ${cacheKey}`, error)
  }
}

/**
 * Invalidate cache by tag pattern
 * Useful for invalidating related caches (e.g., all product caches)
 */
export async function invalidateCacheTag(tag: string, namespace: string = 'query') {
  if (!redis) return

  try {
    // Note: Upstash Redis doesn't support pattern deletion directly
    // This is a simplified implementation
    // For production, consider using Redis with full pattern support
    console.log(`[CACHE] Tag invalidation (manual cleanup needed): ${tag}`)
  } catch (error) {
    console.error(`[CACHE] Tag invalidation failed: ${tag}`, error)
  }
}

/**
 * Clear all cache
 * Use with caution in production
 */
export async function clearAllCache() {
  if (!redis) return

  try {
    // This would require appropriate Redis permissions
    // For Upstash, we recommend managing keys explicitly
    console.warn('[CACHE] Full cache clear requested')
  } catch (error) {
    console.error('[CACHE] Clear all failed', error)
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(namespace: string = 'query') {
  if (!redis) {
    return { enabled: false }
  }

  try {
    const [ping, dbsize] = await Promise.all([
      redis.ping(),
      redis.dbsize().catch(() => null),
    ])

    return {
      enabled: true,
      namespace,
      ping,
      dbsize,
    }
  } catch (error) {
    console.error('[CACHE] Stats fetch failed', error)
    return { enabled: false, error }
  }
}

/**
 * Cache helper for Mongoose queries
 */
export function createCachedQuery<T>(
  namespace: string,
  ttl: number = 300
) {
  return async (key: string, queryFn: () => Promise<T>) => {
    return getCachedQuery<T>(key, queryFn, {
      ttl,
      namespace,
    })
  }
}

/**
 * Type-safe cache wrappers for common queries
 */
export const productCache = createCachedQuery('products', 300)
export const userCache = createCachedQuery('users', 600)
export const orderCache = createCachedQuery('orders', 120)
export const analyticsCache = createCachedQuery('analytics', 60)
export const vendorCache = createCachedQuery('vendors', 300)

export default {
  getCachedQuery,
  getCachedQuerySWR,
  invalidateCache,
  invalidateCacheTag,
  clearAllCache,
  getCacheStats,
  createCachedQuery,
  productCache,
  userCache,
  orderCache,
  analyticsCache,
  vendorCache,
}
