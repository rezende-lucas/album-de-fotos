import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Pencil, Siren } from 'lucide-react'
import MiniMapa from '@/components/MiniMapa'
import ExcluirAbordagemButton from '@/components/ExcluirAbordagemButton'
import { formatDateTime, formatRelativeDate } from '@/lib/format'
import type { Abordagem, FotoView, Perfil } from '@/types'

interface AbordagensTimelineProps {
    funcionarioId: string
    abordagens: Abordagem[]
    fotos: FotoView[]
    nomes: Record<string, string>
    perfil: Perfil | null
    podeRegistrar: boolean
}

/** Histórico de abordagens da pessoa (mais recente primeiro). */
export default function AbordagensTimeline({ funcionarioId, abordagens, fotos, nomes, perfil, podeRegistrar }: AbordagensTimelineProps) {
    const isAdmin = perfil?.papel === 'admin'

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Siren className="h-5 w-5 text-amber-500" />
                    <h3 className="font-semibold text-fg">Abordagens ({abordagens.length})</h3>
                </div>
            </div>

            {abordagens.length === 0 ? (
                <p className="text-fg-muted italic text-sm">Nenhuma abordagem registrada.</p>
            ) : (
                <ol className="relative border-l-2 border-line ml-2 space-y-5">
                    {abordagens.map((a) => {
                        const fotosDaAbordagem = fotos.filter((f) => f.abordagem_id === a.id)
                        const podeEditar = isAdmin || (perfil && a.agente_id === perfil.user_id)
                        return (
                            <li key={a.id} className="ml-4">
                                <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-amber-500 ring-4 ring-surface" />
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-semibold text-fg">{formatDateTime(a.data_hora)}</p>
                                            <p className="text-xs text-fg-subtle">
                                                {formatRelativeDate(a.data_hora)}
                                                {a.agente_id && nomes[a.agente_id] && <> · por {nomes[a.agente_id]}</>}
                                            </p>
                                        </div>
                                        {podeRegistrar && podeEditar && (
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <Link
                                                    href={`/funcionarios/${funcionarioId}/abordagens/${a.id}/editar`}
                                                    aria-label="Editar abordagem"
                                                    title="Editar abordagem"
                                                    className="p-2 text-fg-muted hover:text-blue-600 hover:bg-surface-muted rounded-full"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                                {isAdmin && <ExcluirAbordagemButton id={a.id} />}
                                            </div>
                                        )}
                                    </div>

                                    {a.motivo && (
                                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                            {a.motivo}
                                        </span>
                                    )}
                                    {a.local_descricao && (
                                        <p className="text-sm text-fg-soft flex items-start gap-1">
                                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-fg-subtle" />
                                            {a.local_descricao}
                                        </p>
                                    )}
                                    {a.observacoes && <p className="text-sm text-fg-soft whitespace-pre-line">{a.observacoes}</p>}
                                    {a.latitude !== null && a.longitude !== null && (
                                        <MiniMapa latitude={a.latitude} longitude={a.longitude} precisao={a.precisao_m} />
                                    )}
                                    {fotosDaAbordagem.length > 0 && (
                                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                            {fotosDaAbordagem.map((f) => (
                                                <div key={f.id} className="relative h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden bg-surface-muted">
                                                    {f.thumbSrc && <Image src={f.thumbSrc} alt={f.legenda ?? 'Foto da abordagem'} fill sizes="56px" className="object-cover" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </li>
                        )
                    })}
                </ol>
            )}
        </div>
    )
}
