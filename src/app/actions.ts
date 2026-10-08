'use server'

import { createClient } from '@/lib/supabase/server'
import { listarFuncionarios, type ListarFuncionariosParams } from '@/lib/funcionarios'

/** Chamada pela lista (busca, filtro e rolagem infinita). RLS garante o acesso. */
export async function buscarFuncionariosAction(params: ListarFuncionariosParams) {
    const supabase = await createClient()
    return listarFuncionarios(supabase, {
        termo: String(params.termo ?? '').slice(0, 200),
        cidade: params.cidade ? String(params.cidade) : null,
        offset: Math.max(0, Math.floor(Number(params.offset) || 0)),
    })
}
