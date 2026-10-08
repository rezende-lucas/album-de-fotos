import Image from 'next/image'
import { IdCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPerfil } from '@/lib/auth'
import RoleSelect from '@/components/RoleSelect'
import UsuarioStatusAcoes from '@/components/UsuarioStatusAcoes'
import { formatDateTime } from '@/lib/format'
import type { PerfilCompleto, StatusConta } from '@/types'

const STATUS: Record<StatusConta, { label: string, className: string }> = {
    pendente: { label: 'Pendente', className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    ativo: { label: 'Ativo', className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
    recusado: { label: 'Recusado', className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
    bloqueado: { label: 'Bloqueado', className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
}

const ORDEM: Record<StatusConta, number> = { pendente: 0, ativo: 1, bloqueado: 2, recusado: 3 }

export default async function UsuariosPage() {
    const supabase = await createClient()
    const [perfilAtual, { data, error }] = await Promise.all([
        getPerfil(),
        supabase.from('perfis').select('*').order('created_at', { ascending: false }),
    ])

    if (error) throw new Error(`Erro ao carregar usuários: ${error.message}`)
    const perfis = ((data ?? []) as PerfilCompleto[])
        .map((p) => ({ ...p, status: p.status ?? 'ativo' }))
        .sort((a, b) => ORDEM[a.status] - ORDEM[b.status])

    // Fotos das funcionais (bucket privado: só admin consegue assinar)
    const caminhos = perfis.map((p) => p.funcional_url).filter((c): c is string => !!c)
    const urls: Record<string, string> = {}
    if (caminhos.length > 0) {
        const { data: assinadas } = await supabase.storage.from('funcionais').createSignedUrls(caminhos, 600)
        for (const a of assinadas ?? []) if (a.path && a.signedUrl) urls[a.path] = a.signedUrl
    }

    const pendentes = perfis.filter((p) => p.status === 'pendente').length

    return (
        <div className="space-y-3">
            <p className="text-sm text-fg-muted">
                Novos usuários se cadastram em <strong>/cadastro</strong> e ficam <strong>pendentes</strong> até um administrador
                conferir a funcional e aprovar. <strong>Agentes</strong> cadastram e editam; <strong>administradores</strong> também
                excluem, restauram, veem a auditoria e gerenciam usuários.
            </p>
            {pendentes > 0 && (
                <p role="status" className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    {pendentes} {pendentes === 1 ? 'pedido aguardando' : 'pedidos aguardando'} aprovação.
                </p>
            )}

            <ul className="space-y-3">
                {perfis.map((p) => {
                    const status = STATUS[p.status]
                    const voce = p.user_id === perfilAtual?.user_id
                    const funcional = p.funcional_url ? urls[p.funcional_url] : null
                    return (
                        <li
                            key={p.user_id}
                            className={`bg-surface border rounded-2xl p-4 space-y-3 ${p.status === 'pendente' ? 'border-amber-300 dark:border-amber-800' : 'border-line'}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-semibold text-fg truncate">
                                        {p.nome || p.email}
                                        {voce && <span className="ml-2 text-xs font-normal text-fg-subtle">(você)</span>}
                                    </p>
                                    <p className="text-sm text-fg-muted truncate">{p.email}</p>
                                </div>
                                <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${status.className}`}>
                                    {status.label}
                                </span>
                            </div>

                            <dl className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <dt className="text-xs text-fg-muted uppercase font-semibold">CPF</dt>
                                    <dd className="font-mono text-fg">{p.cpf || '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-fg-muted uppercase font-semibold">Matrícula</dt>
                                    <dd className="font-mono text-fg">{p.matricula || '—'}</dd>
                                </div>
                            </dl>

                            {funcional ? (
                                <a href={funcional} target="_blank" rel="noopener noreferrer" className="block relative aspect-[3/2] max-w-sm rounded-xl overflow-hidden bg-black" title="Abrir a funcional em tamanho real">
                                    <Image src={funcional} alt={`Funcional de ${p.nome ?? p.email}`} fill sizes="384px" className="object-contain" />
                                </a>
                            ) : p.status === 'pendente' ? (
                                <p className="flex items-center gap-2 text-sm text-fg-subtle"><IdCard className="h-4 w-4" /> Sem foto da funcional</p>
                            ) : null}

                            {p.created_at && <p className="text-xs text-fg-subtle">Cadastrado em {formatDateTime(p.created_at)}</p>}

                            <div className="flex flex-wrap items-center gap-2">
                                {p.status === 'ativo' && <RoleSelect userId={p.user_id} papel={p.papel} />}
                                {!voce && <UsuarioStatusAcoes userId={p.user_id} status={p.status} nome={p.nome ?? p.email ?? 'usuário'} />}
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
