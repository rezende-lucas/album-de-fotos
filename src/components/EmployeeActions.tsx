'use client'

import { Trash2, Edit } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'

export default function EmployeeActions({ id, canDelete }: { id: string, canDelete: boolean }) {
    const router = useRouter()
    const showToast = useToast()
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Exclusão lógica: vai para a lixeira (a foto é mantida para poder restaurar)
    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const { error } = await createClient()
                .from('funcionarios')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)
            if (error) throw error
            showToast('Movido para a lixeira')
            router.push('/')
            router.refresh()
        } catch (error) {
            console.error('Erro ao excluir:', error)
            showToast('Erro ao excluir abordado', 'error')
            setIsDeleting(false)
            setConfirmOpen(false)
        }
    }

    return (
        <div className="flex gap-4">
            <Link
                href={`/funcionarios/${id}/editar`}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
                <Edit className="h-5 w-5" />
                Editar
            </Link>
            {canDelete && (
                <button
                    type="button"
                    onClick={() => setConfirmOpen(true)}
                    className="flex-1 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    <Trash2 className="h-5 w-5" />
                    Excluir
                </button>
            )}

            <ConfirmDialog
                open={confirmOpen}
                title="Excluir abordado?"
                description="O cadastro vai para a lixeira e pode ser restaurado por um administrador."
                confirmLabel="Excluir"
                destructive
                loading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    )
}
