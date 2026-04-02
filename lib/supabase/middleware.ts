/**
 * Supabase Auth Middleware
 * 
 * ============================================================================
 * TEMPORARY AUTH BYPASS - TEST MODE ACTIVE
 * ============================================================================
 * 
 * Admin authentication is DISABLED for testing purposes.
 * 
 * Current behavior:
 * - /admin/login redirects to /admin (no login required)
 * - All /admin/* routes are accessible without authentication
 * 
 * TO RE-ENABLE ADMIN AUTHENTICATION:
 * 1. Uncomment the admin route protection block below (search for "RE-ENABLE")
 * 2. Restore `await requireAdmin()` in these Server Components:
 *    - app/admin/properties/page.tsx
 *    - app/admin/properties/[id]/edit/page.tsx
 *    - app/admin/partners/page.tsx
 * 3. Create admin user via Supabase Auth + admin_users table
 * 
 * ============================================================================
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ============================================================================
  // TEMPORARY: Admin auth bypass (TEST MODE)
  // ============================================================================
  // Redirect /admin/login directly to /admin dashboard (no login required)
  if (request.nextUrl.pathname === '/admin/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }
  // All /admin/* routes are now accessible without authentication
  // ============================================================================
  
  // RE-ENABLE: Uncomment this block when admin authentication is restored
  /*
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to login page
    if (request.nextUrl.pathname === '/admin/login') {
      // If already logged in, redirect to admin dashboard
      if (user) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

    // For all other admin routes, require authentication
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }
  */

  return supabaseResponse
}
