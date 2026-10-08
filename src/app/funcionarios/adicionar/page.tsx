import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import EmployeeForm from '@/components/EmployeeForm'

export default async function AddEmployeePage({
    searchParams,
}: {
    searchParams: Promise<{ abordagem?: string, cpf?: string, nome?: string }>
}) {
    const { abordagem, cpf, nome } = await searchParams
    const comAbordagem = abordagem === '1'

    return (
        <div className="min-h-screen bg-page pb-safe">
            <header className="bg-surface shadow-sm sticky top-0 z-10 px-4 py-4 flex items-center gap-3">
                <Link href={comAbordagem ? '/abordagens/nova' : '/'} className="p-2 -ml-2 text-fg-soft hover:bg-surface-muted rounded-full" aria-label="Voltar">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-lg font-bold text-fg">{comAbordagem ? 'Nova abordagem — cadastro' : 'Novo Abordado'}</h1>
            </header>

            <main className="p-4 max-w-2xl mx-auto">
                <EmployeeForm comAbordagem={comAbordagem} defaultCpf={cpf?.slice(0, 14)} defaultNome={nome?.slice(0, 120)} />
            </main>
        </div>
    )
}
