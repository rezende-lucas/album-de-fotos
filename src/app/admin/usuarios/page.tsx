import { createClient } from '@/lib/supabase/server'
import { getPerfil } from '@/lib/auth'
import RoleSelect from '@/components/RoleSelect'
import type { Perfil } from '@/types'

export default async function UsuariosPage() {
    const supabase = await createClient()
    const [perfilAtual, { data, error }] = await Promise.all([
        getPerfil(),
        supabase.from('perfis').select('user_id, nome, email, papel').order('nome'),
    ])

    if (error) throw new Error(`Erro ao carregar usuários: ${error.message}`)
    const perfis = (data ?? []) as Perfil[]

    return (
        <div className="space-y-3">
            <p className="text-sm text-fg-muted">
                <strong>Agentes</strong> cadastram e editam. <strong>Administradores</strong> também excluem, restauram,
                veem a auditoria e gerenciam usuários. Novos usuários são criados no painel do Supabase (Authentication → Users)
                e entram como agentes.
            </p>
            <ul className="bg-surface border border-line rounded-2xl divide-y divide-line">
                {perfis.map((p) => (
                    <li key={p.user_id} className="flex items-center justify-between gap-3 p-4">
                        <div className="min-w-0">
                            <p className="font-semibold text-fg truncate">
                                {p.nome || p.email}
                                {p.user_id === perfilAtual?.user_id && <span className="ml-2 text-xs font-normal text-fg-subtle">(você)</span>}
                            </p>
                            {p.nome && <p className="text-sm text-fg-muted truncate">{p.email}</p>}
                        </div>
                        <RoleSelect userId={p.user_id} papel={p.papel} />
                    </li>
                ))}
            </ul>
        </div>
    )
}
