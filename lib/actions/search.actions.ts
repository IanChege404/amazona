/* eslint-disable @typescript-eslint/no-unused-vars */
'use server'

import { semanticSearch, keywordSearch } from '@/lib/ai/search'

export interface SearchOptions {
  query: string
  category?: string
  page?: number
  limit?: number
  method?: 'semantic' | 'keyword'
}

/**
 * Server action for semantic search
 */
export async function searchProducts(options: SearchOptions) {
  const {
    query,
    category,
    page = 1,
    limit = 20,
    method = 'semantic',
  } = options

  try {
    if (!query || query.trim().length === 0) {
      return {
        success: false,
        message: 'Search query is required',
        results: [],
      }
    }

    let result

    if (method === 'keyword') {
      result = await keywordSearch({
        query,
        category,
        limit,
      })
    } else {
      result = await semanticSearch({
        query,
        category,
        limit,
      })
    }

    return {
      ...result,
      success: true,
    }
  } catch (error) {
    console.error('Search error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Search failed',
      results: [],
    }
  }
}
