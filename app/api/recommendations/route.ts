import { NextRequest, NextResponse } from 'next/server'
import { getProductRecommendations, getTrendingInCategory, getTopRatedProducts, getSeasonalProducts } from '@/lib/ai/recommendations'
import { z } from 'zod'

const RecommendationSchema = z.object({
  productId: z.string().optional(),
  userId: z.string().optional(),
  category: z.string().optional(),
  type: z
    .enum(['similar', 'personalized', 'trending', 'toprated', 'seasonal'])
    .optional()
    .default('trending'),
  limit: z.coerce.number().optional().default(8),
})

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams

    const params = RecommendationSchema.parse({
      productId: searchParams.get('productId') || undefined,
      userId: searchParams.get('userId') || undefined,
      category: searchParams.get('category') || undefined,
      type: searchParams.get('type') || 'trending',
      limit: searchParams.get('limit') || '8',
    })

    let products

    switch (params.type) {
      case 'similar':
        if (!params.productId) {
          return NextResponse.json(
            { error: 'Product ID is required for similar recommendations' },
            { status: 400 }
          )
        }
        products = await getProductRecommendations({
          productId: params.productId,
          limit: params.limit,
        })
        break

      case 'personalized':
        if (!params.userId) {
          return NextResponse.json(
            { error: 'User ID is required for personalized recommendations' },
            { status: 400 }
          )
        }
        products = await getProductRecommendations({
          userId: params.userId,
          limit: params.limit,
        })
        break

      case 'toprated':
        products = await getTopRatedProducts(30, params.limit)
        break

      case 'seasonal':
        if (!params.category) {
          return NextResponse.json(
            { error: 'Season/category is required for seasonal recommendations' },
            { status: 400 }
          )
        }
        products = await getSeasonalProducts(
          params.category as 'spring' | 'summer' | 'fall' | 'winter',
          params.limit
        )
        break

      case 'trending':
      default:
        products = await getTrendingInCategory(params.category || 'General', params.limit)
        break
    }

    return NextResponse.json({
      success: true,
      type: params.type,
      products,
      count: products.length,
    })
  } catch (error) {
    console.error('Recommendations API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to get recommendations',
        message: error instanceof Error ? error.message : 'An error occurred',
      },
      { status: 500 }
    )
  }
}
