import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()

    // Create a Supabase client with cookie management
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value }) =>
                cookieStore.set(name, value)
              )
            } catch {
              // If called from a Server Component, ignore.
              // Middleware can refresh sessions automatically.
            }
          },
        },
      }
    )

    // Exchange the code for a Supabase session (sets cookie)
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect after sign in
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}