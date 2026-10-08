export interface Funcionario {
    id: string
    created_at: string
    nome_completo: string
    apelido: string | null
    filiacao: string | null
    endereco: string | null
    cpf: string
    rg: string | null
    foto_url: string | null
    foto_miniatura?: string | null
    ultima_abordagem_em?: string | null
    nome_mae?: string
    nome_pai?: string
    logradouro?: string
    numero?: string
    complemento?: string
    bairro?: string
    cidade?: string
    estado?: string
    cep?: string
    user_id?: string
    updated_at?: string | null
    updated_by?: string | null
    deleted_at?: string | null
    deleted_by?: string | null
}

export const TIPOS_FOTO = {
    rosto: 'Rosto',
    perfil: 'Perfil',
    corpo: 'Corpo inteiro',
    tatuagem: 'Tatuagem / sinal',
    documento: 'Documento',
    outro: 'Outro',
} as const

export type TipoFoto = keyof typeof TIPOS_FOTO

export interface Foto {
    id: string
    funcionario_id: string
    caminho: string
    miniatura: string | null
    tipo: TipoFoto
    legenda: string | null
    principal: boolean
    ordem: number
    abordagem_id?: string | null
}

export interface Abordagem {
    id: string
    funcionario_id: string
    data_hora: string
    latitude: number | null
    longitude: number | null
    precisao_m: number | null
    local_descricao: string | null
    motivo: string | null
    observacoes: string | null
    agente_id: string | null
}

/** Foto pronta para exibição (URLs assinadas). */
export interface FotoView extends Foto {
    src: string | null
    thumbSrc: string | null
}

export type Papel = 'admin' | 'agente'

export type StatusConta = 'pendente' | 'ativo' | 'recusado' | 'bloqueado'

export interface Perfil {
    user_id: string
    nome: string | null
    email: string | null
    papel: Papel
    /** Ausente antes da migração 0006 (tratado como ativo). */
    status?: StatusConta
    created_at?: string
}

/** Dados completos vistos pelo admin na tela de usuários. */
export interface PerfilCompleto extends Perfil {
    cpf: string | null
    matricula: string | null
    funcional_url: string | null
}

export type AcaoAuditoria = 'criado' | 'alterado' | 'excluido' | 'restaurado' | 'apagado'

export interface AuditoriaItem {
    id: number
    tabela: string
    registro_id: string | null
    acao: AcaoAuditoria
    usuario_id: string | null
    antes: Record<string, unknown> | null
    depois: Record<string, unknown> | null
    criado_em: string
}

/** Colunas carregadas na listagem (dashboard). */
export const FUNCIONARIO_LIST_COLUMNS =
    'id, nome_completo, apelido, cpf, rg, nome_mae, nome_pai, logradouro, bairro, cidade, estado, endereco, foto_url, foto_miniatura, ultima_abordagem_em'

export type FuncionarioListItem = Pick<
    Funcionario,
    | 'id' | 'nome_completo' | 'apelido' | 'cpf' | 'rg' | 'nome_mae' | 'nome_pai'
    | 'logradouro' | 'bairro' | 'cidade' | 'estado' | 'endereco' | 'foto_url' | 'foto_miniatura' | 'ultima_abordagem_em'
> & {
    /** URL assinada da foto, pronta para exibição. */
    foto_src: string | null
}
