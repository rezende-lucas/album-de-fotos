'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AbordagemFields from '@/components/AbordagemFields'
import PhotoManager from '@/components/PhotoManager'
import { useToast } from '@/components/Toast'
import { abordagemParaDraft, novaAbordagemDraft, salvarAbordagem, validarAbordagem } from '@/lib/abordagens'
import { salvarFotos, type PhotoDraft } from '@/lib/photo-upload'
import type { Abordagem } from '@/types'

interface AbordagemFormProps {
    funcionarioId: string
    /** Ao editar uma abordagem existente (as fotos não são editadas aqui). */
    abordagem?: Abordagem
}

export default function AbordagemForm({ funcionarioId, abordagem }: AbordagemFormProps) {
    const router = useRouter()
    const showToast = useToast()
    const [draft, setDraft] = useState(() => (abordagem ? abordagemParaDraft(abordagem) : novaAbordagemDraft()))
    const [fotos, setFotos] = useState<PhotoDraft[]>([])
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    const salvar = async (e: React.FormEvent) => {
        e.preventDefault()
        const invalido = validarAbordagem(draft)
        if (invalido) {
            setErro(invalido)
            return
        }

        setSalvando(true)
        setErro(null)
        const supabase = createClient()
        let abordagemId = abordagem?.id
        try {
            abordagemId = await salvarAbordagem(supabase, funcionarioId, draft, abordagem?.id)
        } catch (err) {
            console.error(err)
            setErro((err as { message?: string }).message || 'Erro ao salvar a abordagem')
            setSalvando(false)
            return
        }

        if (fotos.length > 0) {
            try {
                // Depois das fotos já existentes do álbum
                await salvarFotos(supabase, funcionarioId, fotos, [], { abordagemId, ordemBase: 1000 })
            } catch (err) {
                console.error(err)
                showToast('Abordagem salva, mas houve erro ao enviar as fotos.', 'error')
                router.push(`/funcionarios/${funcionarioId}`)
                router.refresh()
                return
            }
        }

        showToast(abordagem ? 'Abordagem atualizada' : 'Abordagem registrada')
        router.push(`/funcionarios/${funcionarioId}`)
        router.refresh()
    }

    return (
        <form onSubmit={salvar} className="space-y-8" noValidate>
            {erro && (
                <div role="alert" className="p-4 bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900 rounded-xl border text-sm">
                    {erro}
                </div>
            )}

            <section className="space-y-4">
                <h2 className="text-sm font-bold text-fg uppercase tracking-wider">Abordagem</h2>
                <div className="bg-surface p-4 rounded-2xl shadow-sm border border-line">
                    <AbordagemFields value={draft} onChange={setDraft} autoCapturarLocal={!abordagem} />
                </div>
            </section>

            {!abordagem && (
                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-fg uppercase tracking-wider">Fotos da abordagem</h2>
                    <div className="bg-surface p-4 rounded-2xl shadow-sm border border-line">
                        <PhotoManager value={fotos} onChange={setFotos} semPrincipal />
                    </div>
                </section>
            )}

            <button
                type="submit"
                disabled={salvando}
                className="w-full sticky bottom-6 flex justify-center items-center gap-2 py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 dark:shadow-none active:scale-[0.98] transition-all disabled:opacity-70"
            >
                {salvando ? <Loader2 className="animate-spin" aria-label="Salvando" /> : <><Save className="h-5 w-5" /> {abordagem ? 'Salvar alterações' : 'Registrar abordagem'}</>}
            </button>
        </form>
    )
}
