import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const publicPages = [
  '/',
  '/search',
  '/sign-in',
  '/sign-up',
  '/cart',
  '/cart/(.*)',
  '/product/(.*)',
  '/page/(.*)',
  '/store/(.*)',
  '/become-a-vendor',
  // (/secret requires auth)
]

const intlMiddleware = createMiddleware(routing)

export async function middleware(req: NextRequest) {
  const publicPathnameRegex = RegExp(
    `^(/(${routing.locales.join('|')}))?(${publicPages
      .flatMap((p) => (p === '/' ? ['', '/'] : p))
      .join('|')})/?$`,
    'i'
  )
  const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname)

  if (isPublicPage) {
    return intlMiddleware(req)
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token?.sub) {
    const newUrl = new URL(
      `/sign-in?callbackUrl=${encodeURIComponent(req.nextUrl.pathname) || '/'}`,
      req.nextUrl.origin
    )
    return NextResponse.redirect(newUrl)
  }

  const pathname = req.nextUrl.pathname
  const role = (token.role as string) || 'user'

  if (pathname.includes('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.nextUrl.origin))
  }

  if (pathname.includes('/vendor') && role !== 'vendor' && role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.nextUrl.origin))
  }

  return intlMiddleware(req)
}

export const config = {
  // Skip all paths that should not be internationalized
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}

