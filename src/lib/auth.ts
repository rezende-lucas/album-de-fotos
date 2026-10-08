import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Perfil } from '@/types'

/** Perfil do usuário logado (uma consulta por requisição). `null` se não estiver logado. */
export const getPerfil = cache(async (): Promise<Perfil | null> => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
        .from('perfis')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

    // Sem perfil (migração 0003 ainda não aplicada): trata como agente
    return (data as Perfil | null) ?? { user_id: user.id, nome: null, email: user.email ?? null, papel: 'agente' }
})

/** Nomes de exibição dos usuários informados (para "Cadastrado por …"). */
export async function getNomesUsuarios(ids: (string | null | undefined)[]): Promise<Record<string, string>> {
    const unique = [...new Set(ids.filter((id): id is string => !!id))]
    if (unique.length === 0) return {}

    const supabase = await createClient()
    const { data } = await supabase.from('perfis').select('user_id, nome, email').in('user_id', unique)

    const nomes: Record<string, string> = {}
    for (const p of (data ?? []) as Pick<Perfil, 'user_id' | 'nome' | 'email'>[]) {
        nomes[p.user_id] = p.nome || p.email || 'Usuário'
    }
    return nomes
}
