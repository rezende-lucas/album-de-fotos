import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPerfil } from '@/lib/auth'
import AbordagemForm from '@/components/AbordagemForm'
import type { Abordagem } from '@/types'

export default async function EditarAbordagemPage({ params }: { params: Promise<{ id: string, abordagemId: string }> }) {
    const { id, abordagemId } = await params
    const supabase = await createClient()
    const [perfil, { data }] = await Promise.all([
        getPerfil(),
        supabase.from('abordagens').select('*').eq('id', abordagemId).eq('funcionario_id', id).maybeSingle(),
    ])
    const abordagem = data as Abordagem | null
    // Só o autor ou um admin pode editar (o banco também garante)
    if (!abordagem || !perfil || (abordagem.agente_id !== perfil.user_id && perfil.papel !== 'admin')) notFound()

    return (
        <div className="min-h-screen bg-page pb-safe">
            <header className="bg-surface shadow-sm sticky top-0 z-10 px-4 py-4 flex items-center gap-3">
                <Link href={`/funcionarios/${id}`} className="p-2 -ml-2 text-fg-soft hover:bg-surface-muted rounded-full" aria-label="Voltar">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-lg font-bold text-fg">Editar abordagem</h1>
            </header>
            <main className="p-4 max-w-2xl mx-auto">
                <AbordagemForm funcionarioId={id} abordagem={abordagem} />
            </main>
        </div>
    )
}
