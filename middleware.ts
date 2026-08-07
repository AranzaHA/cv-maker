import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    const { supabase, supabaseResponse } = await createClient(request)

    const { data: { user } } = await supabase.auth.getUser()

    if (
        !user &&
        (request.nextUrl.pathname.startsWith('/dashboard') ||
         request.nextUrl.pathname.startsWith('/cv'))
    ) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return Response.redirect(url)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
