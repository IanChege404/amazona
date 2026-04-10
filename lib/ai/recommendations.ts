/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import Review from '@/lib/db/models/review.model'
import { generateEmbedding, productToEmbeddingText } from './embeddings'

export interface RecommendationOptions {
  productId?: string
  userId?: string
  category?: string
  limit?: number
}

/**
 * Get AI-powered product recommendations
 * Based on product similarity, ratings, and user history
 */
export async function getProductRecommendations(
  options: RecommendationOptions
): Promise<any[]> {
  const { productId, userId, category, limit = 8 } = options

  await connectToDatabase()

  try {
    // If productId provided, find similar products
    if (productId) {
      return await getSimilarProducts(productId, limit)
    }

    // If userId provided, recommend based on their purchase history
    if (userId) {
      return await getPersonalizedRecommendations(userId, limit)
    }

    // Default: return trending/top-rated products
    return await getTrendingProducts(category, limit)
  } catch (error) {
    console.error('Recommendation error:', error)
    return []
  }
}

/**
 * Find products similar to a given product using embeddings
 */
async function getSimilarProducts(productId: string, limit: number = 8): Promise<any[]> {
  const product = await Product.findById(productId).select('embedding category vendorId')

  if (!product || !product.embedding || product.embedding.length === 0) {
    // Fallback to same-category products
    return Product.find({
      category: product?.category || 'General',
      isPublished: true,
      _id: { $ne: productId },
    })
      .limit(limit)
      .sort({ avgRating: -1, numReviews: -1 })
      .lean()
  }

  // Use vector search to find similar products
  try {
    const pipeline: any[] = [
      {
        $match: {
          isPublished: true,
          _id: { $ne: productId },
          embedding: { $exists: true, $ne: [] },
        },
      },
      {
        $addFields: {
          similarity: {
            $let: {
              vars: {
                dotProduct: {
                  $reduce: {
                    input: { $range: [0, { $size: '$embedding' }] },
                    initialValue: 0,
                    in: {
                      $add: [
                        '$$value',
                        {
                          $multiply: [
                            { $arrayElemAt: ['$embedding', '$$this'] },
                            { $arrayElemAt: [product.embedding, '$$this'] },
                          ],
                        },
                      ],
                    },
                  },
                },
              },
              in: '$$dotProduct',
            },
          },
        },
      },
      {
        $sort: { similarity: -1, avgRating: -1 },
      },
      {
        $limit: limit,
      },
      {
        $project: { embedding: 0 },
      },
    ]

    const similar = await Product.aggregate(pipeline)
    return similar
  } catch (error) {
    console.warn('Vector similarity search failed, using category fallback:', error)

    // Fallback to category-based recommendations
    return Product.find({
      category: product?.category || 'General',
      isPublished: true,
      _id: { $ne: productId },
    })
      .limit(limit)
      .sort({ avgRating: -1, numReviews: -1 })
      .lean()
  }
}

/**
 * Get personalized recommendations based on user's purchase/review history
 */
async function getPersonalizedRecommendations(userId: string, limit: number = 8): Promise<any[]> {
  // Find products the user has reviewed or purchased
  const userReviews = await Review.find({ user: userId })
    .select('product rating')
    .lean()

  const likedProductIds = userReviews
    .filter((r: any) => r.rating >= 4)
    .map((r: any) => r.product)

  if (likedProductIds.length === 0) {
    // No history, return trending products
    return getTrendingProducts(undefined, limit)
  }

  // Get categories from liked products
  const likedProducts = await Product.find({ _id: { $in: likedProductIds } })
    .select('category')
    .lean()

  const categories = [...new Set(likedProducts.map((p: any) => p.category))]

  // Recommend similar products from same categories
  const recommendations = await Product.find({
    category: { $in: categories },
    _id: { $nin: likedProductIds },
    isPublished: true,
  })
    .limit(limit)
    .sort({ avgRating: -1, numReviews: -1 })
    .lean()

  return recommendations
}

/**
 * Get trending/top-rated products
 */
async function getTrendingProducts(category?: string, limit: number = 8): Promise<any[]> {
  const filter: any = { isPublished: true }

  if (category) {
    filter.category = category
  }

  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  const products = await Product.find(filter)
    .sort({
      numSales: -1,
      avgRating: -1,
      numReviews: -1,
      createdAt: -1,
    })
    .limit(limit)
    .lean()

  return products
}

/**
 * Get products trending in a specific category
 */
export async function getTrendingInCategory(
  category: string,
  limit: number = 6
): Promise<any[]> {
  const products = await Product.find({
    category,
    isPublished: true,
  })
    .sort({ numSales: -1, avgRating: -1, numReviews: -1 })
    .limit(limit)
    .lean()

  return products
}

/**
 * Get products with highest ratings in timeframe
 */
export async function getTopRatedProducts(
  daysBack: number = 30,
  limit: number = 6
): Promise<any[]> {
  const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)

  const products = await Product.find({
    isPublished: true,
    numReviews: { $gte: 3 }, // At least 3 reviews
    avgRating: { $gte: 4 }, // Rating 4+
    updatedAt: { $gte: cutoffDate },
  })
    .sort({ avgRating: -1, numReviews: -1 })
    .limit(limit)
    .lean()

  return products
}

/**
 * Get seasonal/seasonal recommendations based on product tags
 */
export async function getSeasonalProducts(
  season: 'spring' | 'summer' | 'fall' | 'winter',
  limit: number = 6
): Promise<any[]> {
  const seasonKeywords: Record<string, string[]> = {
    spring: ['spring', 'fresh', 'light', 'pastel', 'renewal'],
    summer: ['summer', 'beach', 'bright', 'outdoor', 'sunny'],
    fall: ['fall', 'autumn', 'warm', 'cozy', 'harvest'],
    winter: ['winter', 'cold', 'warm', 'thermal', 'holiday'],
  }

  const keywords = seasonKeywords[season] || []

  const products = await Product.find({
    isPublished: true,
    tags: { $in: keywords },
  })
    .limit(limit)
    .sort({ avgRating: -1, numReviews: -1 })
    .lean()

  return products
}
