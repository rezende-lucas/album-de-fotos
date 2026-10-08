import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - manifest.json (PWA manifest)
         * - icons/* (PWA icons)
         * - service worker files (sw.js, workbox-*, swe-worker-*, fallback-*)
         */
        '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/.*|sw\\.js|workbox-.*|swe-worker-.*|fallback-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
