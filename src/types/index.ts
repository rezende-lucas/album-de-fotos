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
}
