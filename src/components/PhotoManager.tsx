'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Camera, Loader2, Star, Trash2 } from 'lucide-react'
import { MAX_FOTOS, prepararFoto, type PhotoDraft } from '@/lib/photo-upload'
import { TIPOS_FOTO, type TipoFoto } from '@/types'

interface PhotoManagerProps {
    value: PhotoDraft[]
    onChange: (drafts: PhotoDraft[]) => void
}

/** Álbum do cadastro no formulário: adicionar, escolher a principal, tipo/legenda e remover. */
export default function PhotoManager({ value, onChange }: PhotoManagerProps) {
    const [processando, setProcessando] = useState(0)
    const [erro, setErro] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const latest = useRef(value)
    latest.current = value

    // Libera as pré-visualizações locais (blob:) ao sair da tela
    const blobs = useRef(new Set<string>())
    useEffect(() => {
        const urls = blobs.current
        return () => urls.forEach((url) => URL.revokeObjectURL(url))
    }, [])

    const update = (drafts: PhotoDraft[]) => {
        // Sempre há uma principal quando existe alguma foto
        if (drafts.length > 0 && !drafts.some((d) => d.principal)) {
            drafts = drafts.map((d, i) => ({ ...d, principal: i === 0 }))
        }
        latest.current = drafts
        onChange(drafts)
    }

    const adicionar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const arquivos = Array.from(event.target.files ?? []).slice(0, MAX_FOTOS - latest.current.length)
        event.target.value = ''
        if (arquivos.length === 0) return

        setErro(null)
        setProcessando((n) => n + arquivos.length)
        for (const original of arquivos) {
            try {
                const { file, thumbFile } = await prepararFoto(original)
                const previewUrl = URL.createObjectURL(thumbFile)
                blobs.current.add(previewUrl)
                update([...latest.current, {
                    key: `nova-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    file,
                    thumbFile,
                    previewUrl,
                    tipo: latest.current.length === 0 ? 'rosto' : 'outro',
                    legenda: '',
                    principal: latest.current.length === 0,
                }])
            } catch (err) {
                console.error('Erro ao processar imagem:', err)
                setErro('Não foi possível processar uma das imagens. Tente outra foto.')
            } finally {
                setProcessando((n) => n - 1)
            }
        }
    }

    const alterar = (key: string, campos: Partial<PhotoDraft>) =>
        update(value.map((d) => (d.key === key ? { ...d, ...campos } : d)))

    const tornarPrincipal = (key: string) =>
        update(value.map((d) => ({ ...d, principal: d.key === key })))

    const remover = (key: string) => update(value.filter((d) => d.key !== key))

    const podeAdicionar = value.length + processando < MAX_FOTOS

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {value.map((foto) => (
                    <div key={foto.key} className="space-y-2">
                        <div className={`relative aspect-square rounded-xl overflow-hidden bg-black ${foto.principal ? 'ring-2 ring-blue-500' : ''}`}>
                            {foto.previewUrl && (
                                <Image src={foto.previewUrl} alt={TIPOS_FOTO[foto.tipo]} fill sizes="200px" className="object-cover" />
                            )}
                            <div className="absolute top-1.5 right-1.5 flex gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => tornarPrincipal(foto.key)}
                                    aria-pressed={foto.principal}
                                    aria-label={foto.principal ? 'Foto principal' : 'Tornar principal'}
                                    title={foto.principal ? 'Foto principal' : 'Tornar principal'}
                                    className={`p-1.5 rounded-full backdrop-blur-sm ${foto.principal ? 'bg-blue-600 text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}
                                >
                                    <Star className="h-4 w-4" fill={foto.principal ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => remover(foto.key)}
                                    aria-label="Remover foto"
                                    title="Remover foto"
                                    className="p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-600 backdrop-blur-sm"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            {foto.principal && (
                                <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-semibold">
                                    Principal
                                </span>
                            )}
                        </div>
                        <select
                            aria-label="Tipo da foto"
                            value={foto.tipo}
                            onChange={(e) => alterar(foto.key, { tipo: e.target.value as TipoFoto })}
                            className="w-full px-2 py-1.5 rounded-lg bg-surface-muted border border-line-strong text-fg text-sm"
                        >
                            {Object.entries(TIPOS_FOTO).map(([tipo, label]) => (
                                <option key={tipo} value={tipo}>{label}</option>
                            ))}
                        </select>
                        <input
                            aria-label="Legenda da foto"
                            value={foto.legenda}
                            onChange={(e) => alterar(foto.key, { legenda: e.target.value })}
                            placeholder="Legenda (opcional)"
                            maxLength={120}
                            className="w-full px-2 py-1.5 rounded-lg bg-surface-muted border border-line-strong text-fg text-base sm:text-sm"
                        />
                    </div>
                ))}

                {Array.from({ length: processando }).map((_, i) => (
                    <div key={`proc-${i}`} className="aspect-square rounded-xl bg-surface-muted flex items-center justify-center text-fg-subtle" aria-label="Processando foto">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ))}

                {podeAdicionar && (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-line-strong bg-surface-muted hover:border-blue-500 flex flex-col items-center justify-center gap-2 text-fg-muted transition-colors"
                    >
                        <span className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                            <Camera className="h-6 w-6" />
                        </span>
                        <span className="text-sm font-medium text-fg">{value.length === 0 ? 'Tirar foto / Upload' : 'Adicionar foto'}</span>
                    </button>
                )}
            </div>

            <input ref={inputRef} type="file" accept="image/*" multiple onChange={adicionar} className="hidden" />

            <p className="text-xs text-fg-subtle">
                Rosto, perfil, tatuagens, documentos… Toque na ★ para escolher a foto principal. Até {MAX_FOTOS} fotos.
            </p>
            {erro && <p role="alert" className="error">{erro}</p>}
        </div>
    )
}
