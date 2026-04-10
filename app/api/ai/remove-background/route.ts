import { auth } from '@/auth'
import { enforceAIGenerationLimit, SubscriptionError } from '@/lib/subscription-enforcement'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '1 h'), // 20 per hour
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check vendor status
    const { connectToDatabase } = await import('@/lib/db')
    const Vendor = (await import('@/lib/db/models/vendor.model')).default

    await connectToDatabase()

    const vendor = await Vendor.findOne({ userId: session.user.id })
    if (!vendor || vendor.status !== 'approved') {
      return Response.json(
        { error: 'Only approved vendors can use AI features' },
        { status: 403 }
      )
    }

    // Check subscription tier limit for AI generations
    try {
      await enforceAIGenerationLimit()
    } catch (error) {
      if (error instanceof SubscriptionError) {
        return Response.json(
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

    // Rate limit
    const { success, remaining } = await ratelimit.limit(session.user.id)
    if (!success) {
      return Response.json(
        { error: 'Rate limit exceeded. Maximum 20 removals per hour.' },
        { status: 429 }
      )
    }

    const { imageUrl } = await req.json()

    if (!imageUrl) {
      return Response.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    // Validate URL
    try {
      new URL(imageUrl)
    } catch {
      return Response.json(
        { error: 'Invalid image URL' },
        { status: 400 }
      )
    }

    const apiKey = process.env.REMOVE_BG_API_KEY
    if (!apiKey) {
      return Response.json(
        { error: 'Background removal service not configured' },
        { status: 503 }
      )
    }

    // Call remove.bg API
    const formData = new FormData()
    formData.append('image_url', imageUrl)
    formData.append('size', 'auto')
    formData.append('format', 'png')

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Remove.bg API error:', error)

      return Response.json(
        {
          error:
            response.status === 403
              ? 'API key invalid or quota exceeded'
              : 'Failed to remove background. Please try a different image.',
        },
        { status: 500 }
      )
    }

    // Get image as blob
    const imageBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(imageBuffer).toString('base64')

    // Log AI usage
    try {
      const AIUsageLog = (await import('@/lib/models/ai-usage-log')).default
      await AIUsageLog.create({
        vendorId: vendor._id.toString(),
        featureType: 'remove-background',
        status: 'success',
      })
    } catch (logError) {
      console.warn('Failed to log AI usage:', logError)
      // Don't fail the request if logging fails
    }

    return Response.json(
      {
        image: `data:image/png;base64,${base64}`,
        success: true,
        remaining,
      },
      {
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
        },
      }
    )
  } catch (error) {
    console.error('Background removal error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
