/**
 * Dynamic Manifest API Route
 * Generates manifest.json on the fly with current app version and URLs
 */

import { NextResponse } from 'next/server'
import { manifest } from '@/lib/pwa-manifest'

export async function GET() {
  // Customize manifest with environment-specific values
  const customManifest = {
    ...manifest,
    // Add any runtime customizations here
    start_url: process.env.NEXT_PUBLIC_BASE_URL || '/',
  }

  return NextResponse.json(customManifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  })
}
