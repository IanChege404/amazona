import { NextRequest, NextResponse } from 'next/server'
import { runFullReconciliation } from '@/lib/actions/reconciliation'

/**
 * POST /api/cron/run-reconciliation
 * Run reconciliation as a scheduled cron job
 * 
 * Authorization: Uses CRON_SECRET header for verification
 */
export async function POST(req: NextRequest) {
  try {
    const cronSecret = req.headers.get('authorization')?.replace('Bearer ', '')
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const type = req.headers.get('x-reconciliation-type') || 'full'

    const result = await runFullReconciliation(type as any)

    return NextResponse.json({
      success: true,
      message: 'Reconciliation completed',
      data: result,
    })
  } catch (error) {
    console.error('[CRON] Reconciliation failed:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Reconciliation failed',
      },
      { status: 500 }
    )
  }
}
