import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function proxy(req) {
  const res = NextResponse.next()

  // This line fixes the cookie session sync between Server and Client
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  // --- RULE 1: Protected Auth Pages ---
  // If user is ALREADY logged in, do not let them see the Login page.
  // Send them straight to the Dashboard.
  if (session && req.nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // --- RULE 2: Guest Access ---
  // We do NOT block /dashboard here. 
  // Guests are allowed to visit /dashboard to generate content.

  return res
}

export const config = {
  matcher: [
    // Apply to all routes except static files/images
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}