'use client'

import { Trash2, Edit } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { removePhoto } from '@/lib/photos'
import { useState } from 'react'

export default function EmployeeActions({ id, fotoUrl }: { id: string, fotoUrl: string | null }) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir este abordado? Esta ação não pode ser desfeita.')) return

        setIsDeleting(true)
        try {
            const supabase = createClient()
            const { error } = await supabase.from('funcionarios').delete().eq('id', id)
            if (error) throw error
            await removePhoto(supabase, fotoUrl)
            router.push('/')
            router.refresh()
        } catch (error) {
            console.error('Erro ao excluir:', error)
            alert('Erro ao excluir abordado')
            setIsDeleting(false)
        }
    }

    return (
        <div className="flex gap-4">
            <Link
                href={`/funcionarios/${id}/editar`}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
                <Edit className="h-5 w-5" />
                Editar
            </Link>
            <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-100 text-red-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
                <Trash2 className="h-5 w-5" />
                {isDeleting ? 'Excluindo...' : 'Excluir'}
            </button>
        </div>
    )
}
