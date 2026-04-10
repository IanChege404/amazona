import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { withApiHandler } from '@/lib/api-handler'
import {
  runFullReconciliation,
  getReconciliationStatus,
  getDiscrepancies,
} from '@/lib/actions/reconciliation'

/**
 * GET /api/admin/reconciliation
 * Get reconciliation status and history
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const session = await auth()

  if (!session?.user || !session.user.role?.includes('admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const status = await getReconciliationStatus()

    return NextResponse.json({
      success: true,
      data: status,
    })
  } catch (error) {
    console.error('[API] Failed to get reconciliation status:', error)
    return NextResponse.json(
      { error: 'Failed to get reconciliation status' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/admin/reconciliation
 * Run reconciliation
 */
export const POST = withApiHandler(async (req: NextRequest) => {
  const session = await auth()

  if (!session?.user || !session.user.role?.includes('admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const type = body.type || 'full'

    const result = await runFullReconciliation(type)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to run reconciliation'
    console.error('[API] Reconciliation failed:', error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
})
