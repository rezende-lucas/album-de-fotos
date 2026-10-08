import type { SupabaseClient } from '@supabase/supabase-js'
import { getPhotoPath, getSignedPhotoUrls } from '@/lib/photos'
import { FUNCIONARIO_LIST_COLUMNS, type FuncionarioListItem } from '@/types'

export const PAGE_SIZE = 30

export interface ListarFuncionariosParams {
    termo?: string
    cidade?: string | null
    offset?: number
}

export interface ListarFuncionariosResult {
    items: FuncionarioListItem[]
    total: number
}

/** Busca paginada no banco (RPC buscar_funcionarios) com URLs assinadas só da página atual. */
export async function listarFuncionarios(
    supabase: SupabaseClient,
    { termo = '', cidade = null, offset = 0 }: ListarFuncionariosParams
): Promise<ListarFuncionariosResult> {
    const { data, error, count } = await supabase
        .rpc('buscar_funcionarios', { termo, filtro_cidade: cidade || null }, { count: 'exact' })
        .select(FUNCIONARIO_LIST_COLUMNS)
        .range(offset, offset + PAGE_SIZE - 1)

    if (error) throw new Error(`Erro ao buscar abordados: ${error.message}`)

    const rows = (data ?? []) as unknown as Omit<FuncionarioListItem, 'foto_src'>[]
    const signedUrls = await getSignedPhotoUrls(supabase, rows.map((f) => f.foto_url))

    return {
        items: rows.map((f) => {
            const path = getPhotoPath(f.foto_url)
            return { ...f, foto_src: path ? signedUrls[path] ?? null : null }
        }),
        total: count ?? rows.length,
    }
}

export interface CidadeResumo {
    cidade: string
    total: number
}

export async function listarCidades(supabase: SupabaseClient): Promise<CidadeResumo[]> {
    const { data, error } = await supabase.rpc('listar_cidades')
    if (error) {
        console.error('Erro ao listar cidades:', error)
        return []
    }
    return (data ?? []) as CidadeResumo[]
}
