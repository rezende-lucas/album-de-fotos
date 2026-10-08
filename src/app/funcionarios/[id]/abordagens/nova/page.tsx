import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import AbordagemForm from '@/components/AbordagemForm'
import { formatCpf } from '@/lib/format'

export default async function NovaAbordagemPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data } = await supabase.from('funcionarios').select('id, nome_completo, cpf').eq('id', id).maybeSingle()
    if (!data) notFound()

    return (
        <div className="min-h-screen bg-page pb-safe">
            <header className="bg-surface shadow-sm sticky top-0 z-10 px-4 py-4 flex items-center gap-3">
                <Link href={`/funcionarios/${id}`} className="p-2 -ml-2 text-fg-soft hover:bg-surface-muted rounded-full" aria-label="Voltar">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <div className="min-w-0">
                    <h1 className="text-lg font-bold text-fg">Registrar abordagem</h1>
                    <p className="text-sm text-fg-muted truncate">{data.nome_completo} · {formatCpf(data.cpf)}</p>
                </div>
            </header>
            <main className="p-4 max-w-2xl mx-auto">
                <AbordagemForm funcionarioId={id} />
            </main>
        </div>
    )
}
