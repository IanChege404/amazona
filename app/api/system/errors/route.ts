/**
 * System Errors API
 * Returns tracked errors for monitoring dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { getErrors } from '@/lib/system/error-log'

export async function GET(request: NextRequest) {
  const limit = Math.min(100, Number(request.nextUrl.searchParams.get('limit')) || 10)

  try {
    const errors = getErrors(limit)

    return NextResponse.json(
      {
        errors,
        total: errors.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to fetch errors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch errors' },
      { status: 500 }
    )
  }
}
