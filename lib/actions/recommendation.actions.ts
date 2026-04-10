'use server'

import { getProductRecommendations, getTrendingInCategory, getTopRatedProducts, getSeasonalProducts } from '@/lib/ai/recommendations'

/**
 * Get recommended products based on various criteria
 */
export async function getRecommendedProducts(options: {
  productId?: string
  userId?: string
  category?: string
  type?: 'similar' | 'personalized' | 'trending' | 'toprated' | 'seasonal'
  limit?: number
}) {
  const { productId, userId, category, type = 'trending', limit = 8 } = options

  try {
    let products

    switch (type) {
      case 'similar':
        if (!productId) {
          throw new Error('Product ID is required for similar recommendations')
        }
        products = await getProductRecommendations({
          productId,
          limit,
        })
        break

      case 'personalized':
        if (!userId) {
          throw new Error('User ID is required for personalized recommendations')
        }
        products = await getProductRecommendations({
          userId,
          limit,
        })
        break

      case 'toprated':
        products = await getTopRatedProducts(30, limit)
        break

      case 'seasonal':
        if (!category) {
          throw new Error('Season/category is required for seasonal recommendations')
        }
        products = await getSeasonalProducts(
          category as 'spring' | 'summer' | 'fall' | 'winter',
          limit
        )
        break

      case 'trending':
      default:
        products = await getTrendingInCategory(category || 'General', limit)
        break
    }

    return {
      success: true,
      products: JSON.parse(JSON.stringify(products)),
      count: products.length,
    }
  } catch (error) {
    console.error('Recommendation error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get recommendations',
      products: [],
      count: 0,
    }
  }
}
