import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getNomesUsuarios } from '@/lib/auth'
import { formatCpf, formatDate } from '@/lib/format'
import TrashActions from '@/components/TrashActions'
import type { Funcionario } from '@/types'

type ItemLixeira = Pick<Funcionario, 'id' | 'nome_completo' | 'apelido' | 'cpf' | 'foto_url' | 'deleted_at' | 'deleted_by'>

export default async function LixeiraPage() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('funcionarios')
        .select('id, nome_completo, apelido, cpf, foto_url, deleted_at, deleted_by')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
        .limit(200)

    if (error) throw new Error(`Erro ao carregar a lixeira: ${error.message}`)

    const itens = (data ?? []) as ItemLixeira[]
    const nomes = await getNomesUsuarios(itens.map((i) => i.deleted_by))

    if (itens.length === 0) {
        return (
            <div className="text-center py-16 text-fg-subtle space-y-2">
                <Trash2 className="h-10 w-10 mx-auto" />
                <p>A lixeira está vazia.</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <p className="text-sm text-fg-muted">
                Cadastros excluídos ficam aqui até serem restaurados ou apagados definitivamente.
            </p>
            {itens.map((item) => (
                <div key={item.id} className="bg-surface border border-line rounded-2xl p-4 space-y-3">
                    <div>
                        <Link href={`/funcionarios/${item.id}`} className="font-semibold text-fg hover:underline">
                            {item.nome_completo}
                        </Link>
                        <p className="text-sm text-fg-muted font-mono">{formatCpf(item.cpf)}</p>
                        <p className="text-xs text-fg-subtle mt-1">
                            Excluído em {formatDate(item.deleted_at!)}
                            {item.deleted_by && nomes[item.deleted_by] && <> por {nomes[item.deleted_by]}</>}
                        </p>
                    </div>
                    <TrashActions id={item.id} fotoUrl={item.foto_url} />
                </div>
            ))}
        </div>
    )
}
