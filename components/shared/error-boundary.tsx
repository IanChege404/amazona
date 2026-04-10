'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Global error boundary for catching unhandled errors
 * Used in app/[locale]/error.tsx
 */
export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log the error to monitoring system
    // Sentry will be auto-captured via Error Boundary setup in root layout
    console.error('Error boundary caught:', error)
  }, [error])

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        {/* Error Icon */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4v2m0 0v2m0-6v2m0 0v2M3 12c0 1.657.895 3.1 2.233 3.886M3 12c0-1.657.895-3.1 2.233-3.886M3 12c0-1.657.895-3.1 2.233-3.886M9 3a3 3 0 016 0M3 12c0-1.657.895-3.1 2.233-3.886"
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-center text-2xl font-bold text-gray-900">
          Something went wrong
        </h1>
        <p className="mt-2 text-center text-gray-600">
          We're sorry for the inconvenience. Our team has been notified and we're working to fix it.
        </p>

        {/* Error Details (Dev Only) */}
        {isDev && (
          <div className="mt-6 rounded-md bg-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-700">Error Details (Dev Only):</p>
            <p className="mt-2 font-mono text-xs text-gray-900">{error.message}</p>
            {error.digest && (
              <p className="mt-2 font-mono text-xs text-gray-600">
                Digest: <span className="text-gray-900">{error.digest}</span>
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={reset} className="w-full bg-blue-600 hover:bg-blue-700">
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Go home
          </Button>
        </div>

        {/* Error Reference */}
        {error.digest && (
          <p className="mt-4 text-center text-xs text-gray-500">
            Error ID: <code className="font-mono">{error.digest}</code>
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Not found error boundary
 */
export function NotFoundBoundary() {
  useEffect(() => {
    console.warn('Page not found')
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-6 text-center text-6xl">🔍</div>
        <h1 className="text-center text-2xl font-bold text-gray-900">Page Not Found</h1>
        <p className="mt-2 text-center text-gray-600">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Button
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Go home
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Loading skeleton boundary
 */
export function LoadingBoundary() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="space-y-4">
        <div className="h-4 w-32 animate-pulse rounded-md bg-gray-200" />
        <div className="h-4 w-48 animate-pulse rounded-md bg-gray-200" />
        <div className="h-4 w-40 animate-pulse rounded-md bg-gray-200" />
      </div>
    </div>
  )
}
