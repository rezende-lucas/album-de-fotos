'use client'

import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'

interface ConfirmDialogProps {
    open: boolean
    title: string
    description?: string
    confirmLabel?: string
    destructive?: boolean
    loading?: boolean
    onConfirm: () => void
    onCancel: () => void
}

/** Diálogo de confirmação acessível (usa <dialog> nativo: foco preso e Esc para cancelar). */
export default function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = 'Confirmar',
    destructive = false,
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const ref = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        const dialog = ref.current
        if (!dialog) return
        if (open && !dialog.open) dialog.showModal()
        if (!open && dialog.open) dialog.close()
    }, [open])

    return (
        <dialog
            ref={ref}
            onCancel={(e) => {
                e.preventDefault()
                if (!loading) onCancel()
            }}
            onClick={(e) => {
                // Clique no fundo (fora do conteúdo) cancela
                if (e.target === e.currentTarget && !loading) onCancel()
            }}
            className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-surface text-fg p-0 shadow-xl backdrop:bg-black/50"
        >
            <div className="p-6 space-y-2">
                <h2 className="text-lg font-bold">{title}</h2>
                {description && <p className="text-sm text-fg-muted">{description}</p>}
            </div>
            <div className="flex gap-3 px-6 pb-6">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl font-semibold bg-surface-muted text-fg-soft hover:bg-line-strong transition-colors disabled:opacity-50"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={loading}
                    autoFocus
                    className={`flex-1 py-3 rounded-xl font-semibold text-white flex items-center justify-center transition-colors disabled:opacity-70 ${destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : confirmLabel}
                </button>
            </div>
        </dialog>
    )
}
