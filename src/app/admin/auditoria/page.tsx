import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getNomesUsuarios } from '@/lib/auth'
import { formatDateTime } from '@/lib/format'
import type { AcaoAuditoria, AuditoriaItem } from '@/types'

const POR_PAGINA = 50

const ACOES: Record<AcaoAuditoria, { label: string, className: string }> = {
    criado: { label: 'Cadastrou', className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
    alterado: { label: 'Alterou', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    excluido: { label: 'Excluiu', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    restaurado: { label: 'Restaurou', className: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
    apagado: { label: 'Apagou definitivamente', className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
}

const CAMPOS: Record<string, string> = {
    nome_completo: 'Nome', apelido: 'Apelido', cpf: 'CPF', rg: 'RG', nome_mae: 'Mãe', nome_pai: 'Pai',
    filiacao: 'Filiação', cep: 'CEP', logradouro: 'Rua', numero: 'Número', complemento: 'Complemento',
    bairro: 'Bairro', cidade: 'Cidade', estado: 'UF', endereco: 'Endereço', foto_url: 'Foto', deleted_at: 'Lixeira',
}

function valor(campo: string, v: unknown): string {
    if (v === null || v === undefined || v === '') return '—'
    if (campo === 'foto_url') return 'foto'
    if (campo === 'deleted_at') return formatDateTime(String(v))
    return String(v)
}

export default async function AuditoriaPage({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
    const pagina = Math.max(1, Number((await searchParams).pagina) || 1)
    const offset = (pagina - 1) * POR_PAGINA

    const supabase = await createClient()
    const { data, error, count } = await supabase
        .from('auditoria')
        .select('*', { count: 'exact' })
        .order('criado_em', { ascending: false })
        .range(offset, offset + POR_PAGINA - 1)

    if (error) throw new Error(`Erro ao carregar a auditoria: ${error.message}`)

    const itens = (data ?? []) as AuditoriaItem[]
    const nomes = await getNomesUsuarios(itens.map((i) => i.usuario_id))
    const total = count ?? 0
    const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))

    if (itens.length === 0) {
        return <p className="text-center py-16 text-fg-subtle">Nenhuma alteração registrada ainda.</p>
    }

    return (
        <div className="space-y-3">
            <p className="text-sm text-fg-muted">{total} {total === 1 ? 'registro' : 'registros'} de alteração.</p>

            <ol className="space-y-3">
                {itens.map((item) => {
                    const acao = ACOES[item.acao]
                    const nomeRegistro = String(item.depois?.nome_completo ?? item.antes?.nome_completo ?? 'Registro')
                    const campos = item.acao === 'alterado'
                        ? Object.keys(item.depois ?? {}).filter((c) => c !== 'nome_completo' || item.antes?.nome_completo !== item.depois?.nome_completo)
                        : []

                    return (
                        <li key={item.id} className="bg-surface border border-line rounded-2xl p-4 space-y-2">
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${acao.className}`}>{acao.label}</span>
                                {item.acao === 'apagado' || !item.registro_id ? (
                                    <span className="font-semibold text-fg">{nomeRegistro}</span>
                                ) : (
                                    <Link href={`/funcionarios/${item.registro_id}`} className="font-semibold text-fg hover:underline">
                                        {nomeRegistro}
                                    </Link>
                                )}
                            </div>
                            <p className="text-xs text-fg-subtle">
                                {formatDateTime(item.criado_em)} · {(item.usuario_id && nomes[item.usuario_id]) || 'Sistema'}
                            </p>
                            {campos.length > 0 && (
                                <dl className="text-sm grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 pt-1">
                                    {campos.map((campo) => (
                                        <div key={campo} className="contents">
                                            <dt className="text-fg-muted">{CAMPOS[campo] ?? campo}</dt>
                                            <dd className="text-fg-soft break-words">
                                                <span className="line-through text-fg-subtle">{valor(campo, item.antes?.[campo])}</span>
                                                {' → '}
                                                <span>{valor(campo, item.depois?.[campo])}</span>
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            )}
                        </li>
                    )
                })}
            </ol>

            {totalPaginas > 1 && (
                <nav className="flex items-center justify-between pt-2 text-sm" aria-label="Paginação">
                    {pagina > 1 ? (
                        <Link href={`/admin/auditoria?pagina=${pagina - 1}`} className="px-4 py-2 rounded-xl bg-surface border border-line-strong text-fg-soft hover:bg-surface-muted">
                            ← Mais recentes
                        </Link>
                    ) : <span />}
                    <span className="text-fg-muted">Página {pagina} de {totalPaginas}</span>
                    {pagina < totalPaginas ? (
                        <Link href={`/admin/auditoria?pagina=${pagina + 1}`} className="px-4 py-2 rounded-xl bg-surface border border-line-strong text-fg-soft hover:bg-surface-muted">
                            Mais antigos →
                        </Link>
                    ) : <span />}
                </nav>
            )}
        </div>
    )
}
