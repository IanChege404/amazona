/**
 * Embedding utilities for semantic search
 * Uses OpenAI text-embedding-3-small (1536 dimensions)
 * Must have OPENAI_API_KEY in environment
 */

interface EmbeddingResponse {
  data: Array<{
    embedding: number[]
    index: number
    object: string
  }>
}

/**
 * Generate text embedding using OpenAI
 * Returns a 1536-dimensional vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not configured. Semantic search will not be available.')
    return []
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small',
        encoding_format: 'float',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenAI embedding error:', error)
      return []
    }

    const data: EmbeddingResponse = await response.json()
    return data.data[0].embedding
  } catch (error) {
    console.error('Failed to generate embedding:', error)
    return []
  }
}

/**
 * Build embedding text from a product object
 * Combines key fields for semantic search
 */
export function productToEmbeddingText(product: {
  name: string
  description?: string
  category: string
  brand?: string
  tags?: string[]
}): string {
  const parts = [
    product.name,
    product.category,
    product.brand,
    product.description,
    ...(product.tags || []),
  ]

  return parts
    .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    .join(' ')
}

/**
 * Validate if a text is worth embedding
 */
export function isEmbeddingCandidate(text: string): boolean {
  return text.trim().length > 10
}
