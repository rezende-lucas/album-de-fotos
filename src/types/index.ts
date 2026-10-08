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
}

/** Foto pronta para exibição (URLs assinadas). */
export interface FotoView extends Foto {
    src: string | null
    thumbSrc: string | null
}

export type Papel = 'admin' | 'agente'

export interface Perfil {
    user_id: string
    nome: string | null
    email: string | null
    papel: Papel
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
    'id, nome_completo, apelido, cpf, rg, nome_mae, nome_pai, logradouro, bairro, cidade, estado, endereco, foto_url, foto_miniatura'

export type FuncionarioListItem = Pick<
    Funcionario,
    | 'id' | 'nome_completo' | 'apelido' | 'cpf' | 'rg' | 'nome_mae' | 'nome_pai'
    | 'logradouro' | 'bairro' | 'cidade' | 'estado' | 'endereco' | 'foto_url' | 'foto_miniatura'
> & {
    /** URL assinada da foto, pronta para exibição. */
    foto_src: string | null
}
