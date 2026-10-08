import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import EmployeeList from '@/components/EmployeeList'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
import { listarCidades, listarFuncionarios } from '@/lib/funcionarios'

export default async function Dashboard() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const [{ items, total }, cidades] = await Promise.all([
        listarFuncionarios(supabase, {}),
        listarCidades(supabase),
    ])

    return (
        <div className="min-h-screen bg-page">
            <div className="max-w-6xl mx-auto">
                <header className="px-4 py-6 flex justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-fg">Abordados</h1>
                        <p className="text-sm text-fg-muted">
                            {total} {total === 1 ? 'cadastrado' : 'cadastrados'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/funcionarios/adicionar"
                            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                        >
                            <Plus className="h-5 w-5" />
                            Novo abordado
                        </Link>
                        <LogoutButton />
                    </div>
                </header>

                <main>
                    <EmployeeList initialItems={items} initialTotal={total} cidades={cidades} />
                </main>
            </div>
        </div>
    )
}
