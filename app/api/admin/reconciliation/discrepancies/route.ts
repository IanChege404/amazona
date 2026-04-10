import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { withApiHandler } from '@/lib/api-handler'
import { getDiscrepancies, resolveDiscrepancy } from '@/lib/actions/reconciliation'

/**
 * GET /api/admin/reconciliation/discrepancies
 * Get list of discrepancies with filtering
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const session = await auth()

  if (!session?.user || !session.user.role?.includes('admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)

  try {
    const result = await getDiscrepancies({
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      severity: searchParams.get('severity') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('[API] Failed to get discrepancies:', error)
    return NextResponse.json(
      { error: 'Failed to get discrepancies' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/admin/reconciliation/discrepancies
 * Resolve a discrepancy
 */
export const POST = withApiHandler(async (req: NextRequest) => {
  const session = await auth()

  if (!session?.user || !session.user.role?.includes('admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { discrepancyId, resolution } = body

    if (!discrepancyId || !resolution) {
      return NextResponse.json(
        { error: 'discrepancyId and resolution are required' },
        { status: 400 }
      )
    }

    const updated = await resolveDiscrepancy(
      discrepancyId,
      resolution,
      session.user.id || ''
    )

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to resolve discrepancy'
    console.error('[API] Failed to resolve discrepancy:', error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
})
