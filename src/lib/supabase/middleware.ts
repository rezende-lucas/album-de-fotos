import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl
    const redirect = (to: string) => {
        const url = request.nextUrl.clone()
        url.pathname = to
        url.search = ''
        return NextResponse.redirect(url)
    }

    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/cadastro')
    const isPublicRoute = isAuthRoute || pathname.startsWith('/auth')

    if (!user) {
        return isPublicRoute ? response : redirect('/login')
    }
    if (pathname.startsWith('/auth')) return response

    // Conta ainda não aprovada (ou bloqueada) só vê a tela de espera.
    // O banco também bloqueia os dados (RLS); aqui é só a navegação.
    const { data: perfil, error } = await supabase
        .from('perfis')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle()
    // Sem a migração 0006 a coluna não existe: não bloqueia ninguém
    const ativo = error ? true : perfil?.status === 'ativo'
    const naEspera = pathname.startsWith('/aguardando')

    if (!ativo) return naEspera ? response : redirect('/aguardando')
    if (isAuthRoute || naEspera) return redirect('/')

    return response
}
