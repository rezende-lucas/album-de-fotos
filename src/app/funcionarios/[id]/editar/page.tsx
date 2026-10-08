import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import EmployeeForm from '@/components/EmployeeForm'
import { getSignedPhotoUrl } from '@/lib/photos'
import type { Funcionario } from '@/types'

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
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
    const fotoSrc = await getSignedPhotoUrl(supabase, funcionario.foto_url)

    return (
        <div className="min-h-screen bg-page pb-safe">
            <header className="bg-surface shadow-sm sticky top-0 z-10 px-4 py-4 flex items-center gap-3">
                <Link href={`/funcionarios/${id}`} className="p-2 -ml-2 text-fg-soft hover:bg-surface-muted rounded-full" aria-label="Voltar">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-lg font-bold text-fg">Editar Abordado</h1>
            </header>

            <main className="p-4 max-w-2xl mx-auto">
                <EmployeeForm initialData={funcionario} initialPhotoSrc={fotoSrc} />
            </main>
        </div>
    )
}
