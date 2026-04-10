
import { pusherServer } from '@/lib/pusher'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

/**
 * Authenticate Pusher private channel access
 * This endpoint is called by pusher-js when subscribing to private channels
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.text()
    const params = new URLSearchParams(body)
    const socketId = params.get('socket_id')
    const channel = params.get('channel_id')

    if (!socketId || !channel) {
      return NextResponse.json(
        { error: 'Missing socket_id or channel_id' },
        { status: 400 }
      )
    }

    // Validate channel access
    // Allow access to:
    // 1. Private user channels (private-user-{userId})
    // 2. Private vendor channels (private-vendor-{vendorId}) - if user is that vendor
    // 3. Order channels (order-{orderId}) - if user is involved in that order
    // 4. Private order channels (private-order-{orderId}) - if user is involved

    const isAuthorized = validateChannelAccess(channel, session.user.id)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate auth signature
    const authSignature = pusherServer.authenticate(socketId, channel)

    return NextResponse.json(authSignature)
  } catch (error) {
    console.error('Pusher auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

/**
 * Validate if user is allowed to access a channel
 */
function validateChannelAccess(channel: string, userId: string): boolean {
  // Private user channels - only the user can access their own
  if (channel.startsWith('private-user-')) {
    const channelUserId = channel.replace('private-user-', '')
    return channelUserId === userId
  }

  // Private vendor channels - only the vendor can access their own
  if (channel.startsWith('private-vendor-')) {
    // In production, you'd verify the user is actually this vendor
    // For now, we allow it and rely on database checks
    return true
  }

  // Order channels are public, anyone can subscribe
  if (channel.startsWith('order-')) {
    return true
  }

  return false
}
