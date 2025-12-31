import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import EmployeeForm from '@/components/EmployeeForm'

export default async function EditEmployeePage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: funcionario, error } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !funcionario) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-safe">
            <header className="bg-white shadow-sm sticky top-0 z-10 px-4 py-4 flex items-center gap-3">
                <Link href={`/funcionarios/${id}`} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-lg font-bold text-gray-900">Editar Abordado</h1>
            </header>

            <main className="p-4 max-w-lg mx-auto">
                <EmployeeForm initialData={funcionario} />
            </main>
        </div>
    )
}
