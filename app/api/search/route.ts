import { NextRequest, NextResponse } from 'next/server'
import { semanticSearch, keywordSearch } from '@/lib/ai/search'
import { z } from 'zod'

const SearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  category: z.string().optional(),
  vendor: z.string().optional(),
  limit: z.coerce.number().optional().default(20),
  method: z.enum(['semantic', 'keyword']).optional().default('semantic'),
})

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q')
    const category = searchParams.get('category') || undefined
    const vendor = searchParams.get('vendor') || undefined
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : 20
    const method = (searchParams.get('method') || 'semantic') as 'semantic' | 'keyword'

    const validated = SearchSchema.parse({
      query,
      category,
      vendor,
      limit,
      method,
    })

    let result

    if (validated.method === 'keyword') {
      result = await keywordSearch({
        query: validated.query,
        category: validated.category,
        vendor: validated.vendor,
        limit: validated.limit,
      })
    } else {
      result = await semanticSearch({
        query: validated.query,
        category: validated.category,
        vendor: validated.vendor,
        limit: validated.limit,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Search API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'An error occurred',
      },
      { status: 500 }
    )
  }
}
