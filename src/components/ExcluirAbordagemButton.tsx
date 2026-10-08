'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'

/** Remoção de abordagem (somente admin; as fotos continuam no álbum). */
export default function ExcluirAbordagemButton({ id }: { id: string }) {
    const router = useRouter()
    const showToast = useToast()
    const [aberto, setAberto] = useState(false)
    const [removendo, setRemovendo] = useState(false)

    const remover = async () => {
        setRemovendo(true)
        const { data, error } = await createClient().from('abordagens').delete().eq('id', id).select('id')
        setRemovendo(false)
        setAberto(false)
        if (error || !data?.length) {
            console.error(error)
            showToast('Não foi possível remover a abordagem', 'error')
            return
        }
        showToast('Abordagem removida')
        router.refresh()
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setAberto(true)}
                aria-label="Remover abordagem"
                title="Remover abordagem"
                className="p-2 text-fg-muted hover:text-red-600 hover:bg-surface-muted rounded-full"
            >
                <Trash2 className="h-4 w-4" />
            </button>
            <ConfirmDialog
                open={aberto}
                title="Remover abordagem?"
                description="O registro sai do histórico (fica na auditoria). As fotos continuam no álbum."
                confirmLabel="Remover"
                destructive
                loading={removendo}
                onConfirm={remover}
                onCancel={() => setAberto(false)}
            />
        </>
    )
}
