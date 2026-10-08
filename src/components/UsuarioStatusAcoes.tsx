'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, Check, RotateCcw, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'
import type { StatusConta } from '@/types'

interface Props {
    userId: string
    status: StatusConta
    nome: string
}

const BOTAO = 'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60'

/** Aprovar, recusar, bloquear e reativar contas (somente admin; o banco também valida). */
export default function UsuarioStatusAcoes({ userId, status, nome }: Props) {
    const router = useRouter()
    const showToast = useToast()
    const [salvando, setSalvando] = useState(false)
    const [confirmar, setConfirmar] = useState<'recusado' | 'bloqueado' | null>(null)

    const mudar = async (novo: StatusConta, mensagem: string) => {
        setSalvando(true)
        const { data, error } = await createClient()
            .from('perfis')
            .update({ status: novo })
            .eq('user_id', userId)
            .select('status')
        setSalvando(false)
        setConfirmar(null)
        if (error || !data?.length) {
            showToast(error?.message || 'Não foi possível alterar o usuário', 'error')
            return
        }
        showToast(mensagem)
        router.refresh()
    }

    return (
        <>
            {status === 'pendente' && (
                <>
                    <button type="button" disabled={salvando} onClick={() => mudar('ativo', `${nome} aprovado`)} className={`${BOTAO} bg-green-600 hover:bg-green-700 text-white`}>
                        <Check className="h-4 w-4" /> Aprovar
                    </button>
                    <button type="button" disabled={salvando} onClick={() => setConfirmar('recusado')} className={`${BOTAO} bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-950 dark:text-red-300`}>
                        <X className="h-4 w-4" /> Recusar
                    </button>
                </>
            )}
            {status === 'ativo' && (
                <button type="button" disabled={salvando} onClick={() => setConfirmar('bloqueado')} className={`${BOTAO} bg-surface-muted text-fg-soft hover:bg-line-strong`}>
                    <Ban className="h-4 w-4" /> Bloquear
                </button>
            )}
            {(status === 'recusado' || status === 'bloqueado') && (
                <button type="button" disabled={salvando} onClick={() => mudar('ativo', `${nome} reativado`)} className={`${BOTAO} bg-surface-muted text-fg-soft hover:bg-line-strong`}>
                    <RotateCcw className="h-4 w-4" /> {status === 'recusado' ? 'Aprovar' : 'Reativar'}
                </button>
            )}

            <ConfirmDialog
                open={confirmar !== null}
                title={confirmar === 'recusado' ? `Recusar o cadastro de ${nome}?` : `Bloquear ${nome}?`}
                description={confirmar === 'recusado'
                    ? 'A pessoa não terá acesso. Você pode aprovar depois, se mudar de ideia.'
                    : 'O acesso é cortado imediatamente. Você pode reativar depois.'}
                confirmLabel={confirmar === 'recusado' ? 'Recusar' : 'Bloquear'}
                destructive
                loading={salvando}
                onConfirm={() => confirmar && mudar(confirmar, confirmar === 'recusado' ? 'Cadastro recusado' : 'Usuário bloqueado')}
                onCancel={() => setConfirmar(null)}
            />
        </>
    )
}
