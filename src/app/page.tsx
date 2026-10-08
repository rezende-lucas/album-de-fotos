import { createClient } from '@/lib/supabase/server'
import EmployeeList from '@/components/EmployeeList'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
import { getPhotoPath, getSignedPhotoUrls } from '@/lib/photos'
import { FUNCIONARIO_LIST_COLUMNS, type FuncionarioListItem } from '@/types'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const { data, error } = await supabase
        .from('funcionarios')
        .select(FUNCIONARIO_LIST_COLUMNS)
        .order('nome_completo')

    if (error) {
        console.error(error)
        throw new Error('Erro ao carregar abordados.')
    }

    const rows = (data ?? []) as Omit<FuncionarioListItem, 'foto_src'>[]
    const signedUrls = await getSignedPhotoUrls(supabase, rows.map((f) => f.foto_url))
    const funcionarios: FuncionarioListItem[] = rows.map((f) => {
        const path = getPhotoPath(f.foto_url)
        return { ...f, foto_src: path ? signedUrls[path] ?? null : null }
    })

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="px-4 py-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Abordados</h1>
                    <p className="text-sm text-gray-500">
                        {funcionarios.length} {funcionarios.length === 1 ? 'cadastrado' : 'cadastrados'}
                    </p>
                </div>
                <LogoutButton />
            </header>

            <main>
                <EmployeeList initialFuncionarios={funcionarios} />
            </main>
        </div>
    )
}
