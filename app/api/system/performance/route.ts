/**
 * System Performance API
 * Returns performance metrics and latency percentiles
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPerformanceMetrics } from '@/lib/system/performance-metrics'

export async function GET(_request: NextRequest) {
  const metrics = getPerformanceMetrics()

  return NextResponse.json(metrics, { status: 200 })
}
