/**
 * Debug logging utility for cart and wishlist operations
 * Helps track issues with adding items, updating quantities, removing items, etc.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  timestamp: string
  level: LogLevel
  component: string
  action: string
  data?: any
  error?: string
}

// Store logs in a local array for debugging
const logs: LogEntry[] = []
const MAX_LOGS = 100

export const debugLog = (
  component: string,
  action: string,
  data?: any,
  level: LogLevel = 'info'
) => {
  const timestamp = new Date().toISOString()
  const logEntry: LogEntry = {
    timestamp,
    level,
    component,
    action,
    data,
  }

  // Add to in-memory logs
  logs.push(logEntry)
  if (logs.length > MAX_LOGS) {
    logs.shift()
  }

  // Also log to browser console with color coding
  const prefix = `[${component}] ${action}`
  const style = {
    info: 'color: #0066cc; font-weight: bold;',
    warn: 'color: #ff9900; font-weight: bold;',
    error: 'color: #cc0000; font-weight: bold;',
    debug: 'color: #666666; font-weight: bold;',
  }

  if (data) {
    if (typeof window !== 'undefined') {
      console.log(`%c${prefix}`, style[level], data)
    }
  } else {
    if (typeof window !== 'undefined') {
      console.log(`%c${prefix}`, style[level])
    }
  }
}

export const debugError = (
  component: string,
  action: string,
  error: any,
  context?: any
) => {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const timestamp = new Date().toISOString()

  const logEntry: LogEntry = {
    timestamp,
    level: 'error',
    component,
    action,
    error: errorMessage,
    data: context,
  }

  logs.push(logEntry)
  if (logs.length > MAX_LOGS) {
    logs.shift()
  }

  if (typeof window !== 'undefined') {
    console.error(
      `%c[${component}] ${action} - ERROR`,
      'color: #cc0000; font-weight: bold;',
      errorMessage,
      context
    )
  }
}

/**
 * Get all stored debug logs
 * Useful for sending to backend for analysis
 */
export const getDebugLogs = (): LogEntry[] => {
  return [...logs]
}

/**
 * Clear debug logs
 */
export const clearDebugLogs = () => {
  logs.length = 0
}

/**
 * Format logs for display
 */
export const formatDebugLogs = (): string => {
  return logs
    .map(
      (log) =>
        `${log.timestamp} [${log.level.toUpperCase()}] ${log.component} - ${log.action}${
          log.data ? '\n  Data: ' + JSON.stringify(log.data) : ''
        }${log.error ? '\n  Error: ' + log.error : ''}`
    )
    .join('\n')
}

/**
 * Export logs as JSON
 */
export const exportDebugLogs = (filename = 'debug-logs.json') => {
  const dataStr = JSON.stringify(logs, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
}
