/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import { generateEmbedding, productToEmbeddingText } from './embeddings'

export interface SemanticSearchOptions {
  query: string
  category?: string
  vendor?: string
  limit?: number
  includeUnpublished?: boolean
}

/**
 * Perform semantic search on products using MongoDB Atlas Vector Search
 * Falls back to keyword search if embeddings unavailable
 */
export async function semanticSearch(options: SemanticSearchOptions) {
  const { query, category, vendor, limit = 20, includeUnpublished = false } = options

  await connectToDatabase()

  try {
    // Try vector search first
    const queryEmbedding = await generateEmbedding(query)

    if (queryEmbedding.length === 0) {
      // Fall back to keyword search
      return await keywordSearch({ query, category, vendor, limit, includeUnpublished })
    }

    // MongoDB Atlas Vector Search pipeline
    const pipeline: any[] = [
      {
        $search: {
          cosmosSearch: true,
          vector: queryEmbedding,
          k: limit,
          path: 'embedding',
          filter: {
            ...(includeUnpublished
              ? {}
              : { isPublished: true }),
            ...(category ? { category } : {}),
            ...(vendor ? { vendorId: vendor } : {}),
          },
        },
      },
      {
        $project: {
          similarityScore: { $meta: 'searchScore' },
          document: '$$ROOT',
        },
      },
      { $limit: limit },
    ]

    const results = await Product.aggregate(pipeline)

    return {
      success: true,
      method: 'vector',
      results: results.map((r: any) => ({
        ...r.document,
        score: r.similarityScore,
      })),
      count: results.length,
    }
  } catch (error) {
    console.error('Vector search error, falling back to keyword search:', error)

    // Fall back to keyword search
    return await keywordSearch({ query, category, vendor, limit, includeUnpublished })
  }
}

/**
 * Keyword-based search (fallback)
 */
export async function keywordSearch(options: SemanticSearchOptions) {
  const { query, category, vendor, limit = 20, includeUnpublished = false } = options

  const filter: any = includeUnpublished ? {} : { isPublished: true }

  if (category) {
    filter.category = category
  }

  if (vendor) {
    filter.vendorId = vendor
  }

  const searchTerms = query.split(' ').filter((term) => term.length > 0)

  const orConditions =
    searchTerms.length > 0
      ? [
          ...searchTerms.map((term) => ({
            name: { $regex: term, $options: 'i' },
          })),
          ...searchTerms.map((term) => ({
            description: { $regex: term, $options: 'i' },
          })),
          ...searchTerms.map((term) => ({
            category: { $regex: term, $options: 'i' },
          })),
          ...searchTerms.map((term) => ({
            brand: { $regex: term, $options: 'i' },
          })),
        ]
      : []

  const mongoFilter =
    orConditions.length > 0
      ? {
          ...filter,
          $or: orConditions,
        }
      : filter

  const results = await Product.find(mongoFilter)
    .limit(limit)
    .sort({ avgRating: -1, numReviews: -1 })
    .lean()

  return {
    success: true,
    method: 'keyword',
    results,
    count: results.length,
  }
}

/**
 * Generate and store embeddings for a batch of products
 */
export async function generateEmbeddingsForProducts(
  productIds: string[]
): Promise<{ updated: number; failed: number }> {
  await connectToDatabase()

  let updated = 0
  let failed = 0

  for (const productId of productIds) {
    try {
      const product = await Product.findById(productId)
      if (!product) continue

      const embeddingText = productToEmbeddingText({
        name: product.name,
        description: product.description,
        category: product.category,
        brand: product.brand,
      })

      const embedding = await generateEmbedding(embeddingText)

      if (embedding.length > 0) {
        await Product.findByIdAndUpdate(productId, { embedding })
        updated++
      }
    } catch (error) {
      console.error(`Failed to generate embedding for product ${productId}:`, error)
      failed++
    }
  }

  return { updated, failed }
}
