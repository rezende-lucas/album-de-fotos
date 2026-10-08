import type { SupabaseClient } from '@supabase/supabase-js'
import { fromDateTimeLocal, toDateTimeLocal } from '@/lib/format'
import type { Abordagem } from '@/types'

export const MOTIVOS_SUGERIDOS = [
    'Patrulhamento de rotina',
    'Atitude suspeita',
    'Denúncia',
    'Blitz / operação',
    'Cumprimento de mandado',
    'Ocorrência em andamento',
]

/** Estado do formulário de abordagem. */
export interface AbordagemDraft {
    dataHora: string // valor de <input type="datetime-local">, horário de Brasília
    /** Instante exato em que o formulário foi aberto (usado se a hora não for alterada). */
    inicio: string | null
    latitude: number | null
    longitude: number | null
    precisao: number | null
    local: string
    motivo: string
    observacoes: string
}

export function novaAbordagemDraft(): AbordagemDraft {
    const agora = new Date()
    return { dataHora: toDateTimeLocal(agora), inicio: agora.toISOString(), latitude: null, longitude: null, precisao: null, local: '', motivo: '', observacoes: '' }
}

export function abordagemParaDraft(a: Abordagem): AbordagemDraft {
    return {
        dataHora: toDateTimeLocal(a.data_hora),
        inicio: null,
        latitude: a.latitude,
        longitude: a.longitude,
        precisao: a.precisao_m,
        local: a.local_descricao ?? '',
        motivo: a.motivo ?? '',
        observacoes: a.observacoes ?? '',
    }
}

/** Mensagem de validação, ou null se estiver ok. */
export function validarAbordagem(d: AbordagemDraft): string | null {
    if (!d.dataHora) return 'Informe a data e a hora da abordagem.'
    if (new Date(fromDateTimeLocal(d.dataHora)).getTime() > Date.now() + 5 * 60_000) return 'A data da abordagem não pode estar no futuro.'
    if (!d.local.trim() && d.latitude === null) return 'Informe o local ou use a localização do aparelho.'
    return null
}

/** Cria (sem id) ou atualiza a abordagem. Retorna o id. */
export async function salvarAbordagem(
    supabase: SupabaseClient,
    funcionarioId: string,
    d: AbordagemDraft,
    id?: string
): Promise<string> {
    const campos = {
        // Hora não alterada: instante exato (com segundos) para ordenar abordagens do mesmo minuto
        data_hora: d.inicio && toDateTimeLocal(d.inicio) === d.dataHora ? d.inicio : fromDateTimeLocal(d.dataHora),
        latitude: d.latitude,
        longitude: d.longitude,
        precisao_m: d.precisao,
        local_descricao: d.local.trim() || null,
        motivo: d.motivo.trim() || null,
        observacoes: d.observacoes.trim() || null,
    }

    if (id) {
        const { data, error } = await supabase.from('abordagens').update(campos).eq('id', id).select('id')
        if (error) throw error
        if (!data?.length) throw new Error('Você não tem permissão para editar esta abordagem.')
        return id
    }

    const { data, error } = await supabase
        .from('abordagens')
        .insert({ ...campos, funcionario_id: funcionarioId })
        .select('id')
        .single()
    if (error) throw error
    return data.id as string
}
