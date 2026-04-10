/**
 * Error logging utility
 * Tracks application errors for monitoring dashboard
 */

export interface ErrorLogEntry {
  message: string
  stack?: string
  timestamp: Date
  count: number
}

// In-memory error storage (replace with database in production)
export const errorLog: ErrorLogEntry[] = []

export function logError(message: string, stack?: string) {
  // Find existing error
  const existing = errorLog.find((e) => e.message === message)

  if (existing) {
    existing.count++
    existing.timestamp = new Date()
  } else {
    errorLog.push({
      message,
      stack,
      timestamp: new Date(),
      count: 1,
    })
  }

  // Keep last 100 errors
  if (errorLog.length > 100) {
    errorLog.shift()
  }
}

export function getErrors(limit: number = 10) {
  return errorLog
    .sort((a, b) => {
      const freqDiff = b.count - a.count
      if (freqDiff !== 0) return freqDiff
      return b.timestamp.getTime() - a.timestamp.getTime()
    })
    .slice(0, limit)
    .map((e) => ({
      message: e.message,
      count: e.count,
      lastOccurred: e.timestamp.toISOString(),
    }))
}
