import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Supabase URL placeholder ise veya yapılandırılmamışsa beklemeden geç
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder-project')) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Abort controller with 1.5s timeout to prevent hanging requests
    const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null } }), 1500)
    )

    const userPromise = supabase.auth.getUser()
    const { data: { user } } = await Promise.race([userPromise, timeoutPromise])

    // Koruma gerektiren sayfalar
    const protectedPaths = [
      '/profil/duzenle',
      '/grup/olustur',
      '/bildirimler',
      '/degerlendir',
      '/basvurular',
      '/ayarlar',
      '/admin',
    ]

    const isProtected = protectedPaths.some((p) =>
      request.nextUrl.pathname.startsWith(p)
    )

    if (isProtected && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/giris'
      url.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    // Giriş yapılmışsa auth sayfalarına gitmesin
    if (
      user &&
      (request.nextUrl.pathname === '/giris' ||
        request.nextUrl.pathname === '/kayit')
    ) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  } catch (err) {
    console.error('Middleware auth check error/timeout:', err)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
