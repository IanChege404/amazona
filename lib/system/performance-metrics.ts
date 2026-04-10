/**
 * Performance metrics utility
 * Tracks response times and latency percentiles
 */

// Response time samples (in ms)
export const samples: number[] = []

export function recordResponseTime(duration: number) {
  samples.push(duration)
  // Keep last 10000 samples
  if (samples.length > 10000) {
    samples.shift()
  }
}

export function calculatePercentile(arr: number[], percentile: number): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const index = Math.ceil((percentile / 100) * sorted.length) - 1
  return sorted[index] || 0
}

export function getPerformanceMetrics() {
  if (samples.length === 0) {
    return {
      p50: 0,
      p95: 0,
      p99: 0,
      max: 0,
      min: 0,
      avg: 0,
      samples: 0,
    }
  }

  const p50 = calculatePercentile(samples, 50)
  const p95 = calculatePercentile(samples, 95)
  const p99 = calculatePercentile(samples, 99)
  const max = Math.max(...samples)
  const min = Math.min(...samples)
  const avg = samples.reduce((a, b) => a + b, 0) / samples.length

  return {
    p50: Math.round(p50),
    p95: Math.round(p95),
    p99: Math.round(p99),
    max: Math.round(max),
    min: Math.round(min),
    avg: Math.round(avg),
    samples: samples.length,
  }
}
