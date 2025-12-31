'use client'

import { Trash2, Edit } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function EmployeeActions({ id }: { id: string }) {
    const router = useRouter()
    const supabase = createClient()
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir este abordado?')) return

        setIsDeleting(true)
        try {
            const { error } = await supabase.from('funcionarios').delete().eq('id', id)
            if (error) throw error
            router.push('/')
            router.refresh()
        } catch (error) {
            console.error('Erro ao excluir:', error)
            alert('Erro ao excluir abordado')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="flex gap-4">
            <button
                onClick={() => router.push(`/funcionarios/${id}/editar`)}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
                <Edit className="h-5 w-5" />
                Editar
            </button>
            <button
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
