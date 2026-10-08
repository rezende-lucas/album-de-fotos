import { createClient } from '@/lib/supabase/server'
import { User, MapPin, FileText, Calendar, Pencil, Trash2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import EmployeeImageHeader from '@/components/EmployeeImageHeader'
import EmployeeActions from '@/components/EmployeeActions'
import TrashActions from '@/components/TrashActions'
import { getNomesUsuarios, getPerfil } from '@/lib/auth'
import { getSignedPhotoUrl } from '@/lib/photos'
import { formatCep, formatCpf, formatDate } from '@/lib/format'
import type { Funcionario } from '@/types'

export default async function EmployeeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('id', id)
        .maybeSingle()

    if (error || !data) {
        notFound()
    }

    const funcionario = data as Funcionario
    const [fotoSrc, perfil, nomes] = await Promise.all([
        getSignedPhotoUrl(supabase, funcionario.foto_url),
        getPerfil(),
        getNomesUsuarios([funcionario.user_id, funcionario.updated_by, funcionario.deleted_by]),
    ])
    const isAdmin = perfil?.papel === 'admin'
    const nomeDe = (userId?: string | null) => (userId && nomes[userId]) || null

    return (
        <div className="min-h-screen bg-page pb-safe lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-6 lg:items-start lg:max-w-6xl lg:mx-auto lg:p-6">
            {/* Header Image */}
            <EmployeeImageHeader
                fotoUrl={fotoSrc}
                nomeCompleto={funcionario.nome_completo}
                apelido={funcionario.apelido}
            />

            <main className="p-4 -mt-4 relative z-10 space-y-4 lg:p-0 lg:mt-0">
                {funcionario.deleted_at && (
                    <div role="status" className="bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/50 dark:border-amber-900 dark:text-amber-200 rounded-2xl p-4 space-y-3">
                        <p className="text-sm flex items-start gap-2">
                            <Trash2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>
                                Este cadastro está na <strong>lixeira</strong> desde {formatDate(funcionario.deleted_at)}
                                {nomeDe(funcionario.deleted_by) && <> (excluído por {nomeDe(funcionario.deleted_by)})</>}.
                            </span>
                        </p>
                        <TrashActions id={funcionario.id} fotoUrl={funcionario.foto_url} redirectAfterDelete="/admin/lixeira" />
                    </div>
                )}

                <div className="bg-surface rounded-2xl shadow-sm border border-line p-6 space-y-6">

                    <Section icon={<FileText className="h-5 w-5 text-blue-500" />} title="Documentos">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-fg-muted uppercase font-semibold">CPF</span>
                                <p className="font-mono text-fg">{formatCpf(funcionario.cpf)}</p>
                            </div>
                            <div>
                                <span className="text-xs text-fg-muted uppercase font-semibold">RG</span>
                                <p className="font-mono text-fg">{funcionario.rg || '-'}</p>
                            </div>
                        </div>
                    </Section>

                    <hr className="border-line" />

                    <Section icon={<MapPin className="h-5 w-5 text-red-500" />} title="Endereço">
                        {funcionario.logradouro ? (
                            <div className="text-fg-soft">
                                <p className="font-medium">{[funcionario.logradouro, funcionario.numero].filter(Boolean).join(', ')}</p>
                                {funcionario.complemento && <p className="text-sm text-fg-muted">{funcionario.complemento}</p>}
                                <p>{[funcionario.bairro, [funcionario.cidade, funcionario.estado].filter(Boolean).join('/')].filter(Boolean).join(' - ')}</p>
                                {funcionario.cep && <p className="text-sm text-fg-subtle mt-1">CEP {formatCep(funcionario.cep)}</p>}
                            </div>
                        ) : funcionario.endereco ? (
                            <p className="text-fg-soft">{funcionario.endereco}</p>
                        ) : (
                            <p className="text-fg-muted italic">Endereço não informado</p>
                        )}
                    </Section>

                    <hr className="border-line" />

                    <Section icon={<User className="h-5 w-5 text-purple-500" />} title="Filiação">
                        <div className="space-y-3">
                            <div>
                                <span className="text-xs text-fg-muted uppercase font-semibold">Mãe</span>
                                <p className="text-fg">{funcionario.nome_mae || funcionario.filiacao || 'Não informado'}</p>
                            </div>

                            {funcionario.nome_pai && (
                                <div>
                                    <span className="text-xs text-fg-muted uppercase font-semibold">Pai</span>
                                    <p className="text-fg">{funcionario.nome_pai}</p>
                                </div>
                            )}
                        </div>
                    </Section>

                    <hr className="border-line" />

                    {!funcionario.deleted_at && <EmployeeActions id={funcionario.id} canDelete={isAdmin} />}

                    <div className="space-y-1 text-xs text-fg-subtle pt-2 text-center">
                        <p className="flex items-center gap-2 justify-center">
                            <Calendar className="h-4 w-4" />
                            <span>
                                Cadastrado em {formatDate(funcionario.created_at)}
                                {nomeDe(funcionario.user_id) && <> por {nomeDe(funcionario.user_id)}</>}
                            </span>
                        </p>
                        {funcionario.updated_at && (
                            <p className="flex items-center gap-2 justify-center">
                                <Pencil className="h-4 w-4" />
                                <span>
                                    Atualizado em {formatDate(funcionario.updated_at)}
                                    {nomeDe(funcionario.updated_by) && <> por {nomeDe(funcionario.updated_by)}</>}
                                </span>
                            </p>
                        )}
                    </div>

                </div>
            </main>
        </div>
    )
}

function Section({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                {icon}
                <h3 className="font-semibold text-fg">{title}</h3>
            </div>
            <div>{children}</div>
        </div>
    )
}
