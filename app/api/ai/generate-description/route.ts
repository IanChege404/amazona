import { auth } from '@/auth'
import { generateProductDescription } from '@/lib/ai/claude'
import { enforceAIGenerationLimit, SubscriptionError } from '@/lib/subscription-enforcement'
import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { z } from 'zod'

const GenerateDescriptionSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  category: z.string().min(1, 'Category is required'),
  keyFeatures: z
    .array(z.string())
    .min(1, 'At least one feature is required')
    .max(10, 'Maximum 10 features'),
  targetAudience: z.string().optional().default('general consumers'),
  tone: z
    .enum(['professional', 'casual', 'luxury', 'playful'])
    .optional()
    .default('professional'),
})

let ratelimit: Ratelimit | null = null

/**
 * Initialize rate limiter if Redis credentials are available
 */
function initRatelimit() {
  if (ratelimit || !process.env.UPSTASH_REDIS_REST_URL) {
    return ratelimit
  }

  try {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(
        10, // 10 generations
        '1 h' // per hour per user
      ),
    })
    return ratelimit
  } catch {
    console.warn('Upstash rate limiting not configured, proceeding without limits')
    return null
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check vendor status
  const { connectToDatabase } = await import('@/lib/db')
  const Vendor = (await import('@/lib/db/models/vendor.model')).default

  await connectToDatabase()

  const vendor = await Vendor.findOne({ userId: session.user.id })
  if (!vendor || vendor.status !== 'approved') {
    return NextResponse.json(
      { error: 'Only approved vendors can use AI features' },
      { status: 403 }
    )
  }

  // Check subscription tier limit for AI generations
  try {
    await enforceAIGenerationLimit()
  } catch (error) {
    if (error instanceof SubscriptionError) {
      return NextResponse.json(
        {
          error: 'Subscription limit exceeded',
          message: error.message,
          tier: error.tier,
          feature: error.feature,
        },
        { status: 403 }
      )
    }
    throw error
  }

  // Rate limiting
  const limiter = initRatelimit()
  if (limiter) {
    try {
      const { success, remaining, reset } = await limiter.limit(
        `ai-description-${session.user.id}`
      )

      if (!success) {
        const retryAfter = new Date(reset).toISOString()
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: `You can generate 10 descriptions per hour. Please try again later.`,
            retryAfter,
          },
          { status: 429 }
        )
      }

      // Add remaining count to response
      const body = await req.json()
      const validated = GenerateDescriptionSchema.parse(body)

      try {
        const description = await generateProductDescription(validated)

        // Log AI usage
        try {
          const AIUsageLog = (await import('@/lib/models/ai-usage-log')).default
          await AIUsageLog.create({
            vendorId: vendor._id.toString(),
            featureType: 'generate-description',
            status: 'success',
          })
        } catch (logError) {
          console.warn('Failed to log AI usage:', logError)
          // Don't fail the request if logging fails
        }

        return NextResponse.json(
          {
            success: true,
            description,
            remaining,
          },
          { status: 200 }
        )
      } catch (error) {
        console.error('Claude API error:', error)
        return NextResponse.json(
          {
            error: 'Failed to generate description',
            message:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
          },
          { status: 500 }
        )
      }
    } catch (error) {
      console.error('Rate limit error:', error)
      // Continue without rate limiting if Redis is down
    }
  }

  // Generate without rate limit if Redis unavailable
  try {
    const body = await req.json()
    const validated = GenerateDescriptionSchema.parse(body)

    const description = await generateProductDescription(validated)

    // Log AI usage
    try {
      const AIUsageLog = (await import('@/lib/models/ai-usage-log')).default
      await AIUsageLog.create({
        vendorId: vendor._id.toString(),
        featureType: 'generate-description',
        status: 'success',
      })
    } catch (logError) {
      console.warn('Failed to log AI usage:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json(
      {
        success: true,
        description,
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    console.error('API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate description',
        message:
          error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
