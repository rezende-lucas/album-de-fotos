import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import EmployeeForm from '@/components/EmployeeForm'

export default function AddEmployeePage() {
    return (
        <div className="min-h-screen bg-page pb-safe">
            <header className="bg-surface shadow-sm sticky top-0 z-10 px-4 py-4 flex items-center gap-3">
                <Link href="/" className="p-2 -ml-2 text-fg-soft hover:bg-surface-muted rounded-full" aria-label="Voltar">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-lg font-bold text-fg">Novo Abordado</h1>
            </header>

            <main className="p-4 max-w-2xl mx-auto">
                <EmployeeForm />
            </main>
        </div>
    )
}
