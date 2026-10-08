'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { removePhotos } from '@/lib/photos'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'

interface TrashActionsProps {
    id: string
    /** Para onde ir depois de apagar definitivamente (padrão: atualiza a página atual). */
    redirectAfterDelete?: string
}

/** Ações de admin para um registro na lixeira: restaurar ou apagar definitivamente. */
export default function TrashActions({ id, redirectAfterDelete }: TrashActionsProps) {
    const router = useRouter()
    const showToast = useToast()
    const [busy, setBusy] = useState<'restore' | 'delete' | null>(null)
    const [confirmOpen, setConfirmOpen] = useState(false)

    const restore = async () => {
        setBusy('restore')
        const { error } = await createClient().from('funcionarios').update({ deleted_at: null }).eq('id', id)
        setBusy(null)
        if (error) {
            console.error(error)
            showToast('Erro ao restaurar', 'error')
            return
        }
        showToast('Cadastro restaurado')
        router.refresh()
    }

    const deleteForever = async () => {
        setBusy('delete')
        const supabase = createClient()
        // Arquivos do álbum (e a foto antiga, se houver) para apagar do storage depois
        const [{ data: fotos }, { data: funcionario }] = await Promise.all([
            supabase.from('fotos').select('caminho, miniatura').eq('funcionario_id', id),
            supabase.from('funcionarios').select('foto_url').eq('id', id).maybeSingle(),
        ])
        const arquivos = [...(fotos ?? []).flatMap((f) => [f.caminho, f.miniatura]), funcionario?.foto_url]

        const { error } = await supabase.from('funcionarios').delete().eq('id', id)
        if (error) {
            console.error(error)
            showToast('Erro ao apagar definitivamente', 'error')
            setBusy(null)
            setConfirmOpen(false)
            return
        }
        await removePhotos(supabase, [...new Set(arquivos)])
        showToast('Cadastro apagado definitivamente')
        setConfirmOpen(false)
        setBusy(null)
        if (redirectAfterDelete) router.push(redirectAfterDelete)
        router.refresh()
    }

    return (
        <div className="flex gap-2">
            <button
                type="button"
                onClick={restore}
                disabled={busy !== null}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60"
            >
                <RotateCcw className="h-4 w-4" />
                {busy === 'restore' ? 'Restaurando...' : 'Restaurar'}
            </button>
            <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={busy !== null}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-semibold bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900 transition-colors disabled:opacity-60"
            >
                <Trash2 className="h-4 w-4" />
                Apagar
            </button>

            <ConfirmDialog
                open={confirmOpen}
                title="Apagar definitivamente?"
                description="O cadastro e todas as fotos serão removidos para sempre. Esta ação não pode ser desfeita."
                confirmLabel="Apagar"
                destructive
                loading={busy === 'delete'}
                onConfirm={deleteForever}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    )
}
