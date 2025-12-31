import { createClient } from '@/lib/supabase/server'
import EmployeeList from '@/components/EmployeeList'
import { redirect } from 'next/navigation'

import LogoutButton from '@/components/LogoutButton'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const { data: funcionarios, error } = await supabase
        .from('funcionarios')
        .select('*')
        .order('nome_completo')

    if (error) {
        console.error(error)
        return <div className="p-4 text-red-500">Erro ao carregar abordados.</div>
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="px-4 py-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Abordados</h1>
                    <p className="text-sm text-gray-500">
                        {funcionarios?.length || 0} cadastrados
                    </p>
                </div>
                <LogoutButton />
            </header>

            <main>
                <EmployeeList initialFuncionarios={funcionarios || []} />
            </main>
        </div>
    )
}
