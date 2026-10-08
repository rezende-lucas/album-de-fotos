'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, User, X, Maximize2 } from 'lucide-react'
import { TIPOS_FOTO, type FotoView } from '@/types'

interface EmployeeImageHeaderProps {
    fotos: FotoView[]
    nomeCompleto: string
    apelido: string | null
}

export default function EmployeeImageHeader({ fotos, nomeCompleto, apelido }: EmployeeImageHeaderProps) {
    const [aberta, setAberta] = useState<number | null>(null)
    const capa = fotos[0]

    return (
        <div className="lg:sticky lg:top-6 space-y-3">
            <div className="relative h-64 sm:h-80 lg:h-[32rem] lg:rounded-2xl lg:overflow-hidden bg-gray-900 group">
                {capa?.src ? (
                    <button
                        type="button"
                        onClick={() => setAberta(0)}
                        aria-label="Ampliar foto"
                        className="relative block h-full w-full cursor-zoom-in"
                    >
                        <Image
                            src={capa.src}
                            alt={nomeCompleto}
                            fill
                            priority
                            sizes="(min-width: 1024px) 40vw, 100vw"
                            className="object-cover opacity-90 transition-opacity hover:opacity-100"
                        />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/30 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                            <Maximize2 className="h-6 w-6 text-white" />
                        </div>
                    </button>
                ) : (
                    <div className="flex items-center justify-center h-full text-white/20">
                        <User className="h-32 w-32" />
                    </div>
                )}

                <Link
                    href="/"
                    aria-label="Voltar para a lista"
                    className="absolute top-4 left-4 p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-colors z-10"
                >
                    <ArrowLeft className="h-6 w-6" />
                </Link>

                {fotos.length > 1 && (
                    <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-semibold pointer-events-none">
                        {fotos.length} fotos
                    </span>
                )}

                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-gray-900 to-transparent h-32 pointer-events-none" />
                <div className={`absolute left-6 right-6 text-white pointer-events-none ${fotos.length > 1 ? 'bottom-12 lg:bottom-6' : 'bottom-6'}`}>
                    <h1 className="text-3xl font-bold truncate">{apelido || nomeCompleto.split(' ')[0]}</h1>
                    <p className="text-white/80 font-medium truncate">{nomeCompleto}</p>
                </div>
            </div>

            {fotos.length > 1 && (
                <div className="relative z-20 -mt-10 lg:mt-0 px-4 lg:px-0">
                    <ul className="flex gap-2 overflow-x-auto no-scrollbar" aria-label="Fotos">
                        {fotos.map((foto, i) => (
                            <li key={foto.id} className="flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setAberta(i)}
                                    aria-label={`Abrir foto: ${TIPOS_FOTO[foto.tipo]}${foto.legenda ? ` — ${foto.legenda}` : ''}`}
                                    className="relative block h-16 w-16 rounded-xl overflow-hidden border-2 border-surface shadow-md bg-gray-800"
                                >
                                    {foto.thumbSrc && <Image src={foto.thumbSrc} alt="" fill sizes="64px" className="object-cover" />}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {aberta !== null && (
                <PhotoViewer fotos={fotos} inicial={aberta} nome={nomeCompleto} onClose={() => setAberta(null)} />
            )}
        </div>
    )
}

function PhotoViewer({ fotos, inicial, nome, onClose }: {
    fotos: FotoView[]
    inicial: number
    nome: string
    onClose: () => void
}) {
    const [indice, setIndice] = useState(inicial)
    const toqueX = useRef<number | null>(null)
    const foto = fotos[indice]

    const anterior = useCallback(() => setIndice((i) => (i - 1 + fotos.length) % fotos.length), [fotos.length])
    const proxima = useCallback(() => setIndice((i) => (i + 1) % fotos.length), [fotos.length])

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowLeft') anterior()
            if (e.key === 'ArrowRight') proxima()
        }
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', onKeyDown)
        return () => {
            document.body.style.overflow = previousOverflow
            window.removeEventListener('keydown', onKeyDown)
        }
    }, [onClose, anterior, proxima])

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={`Fotos de ${nome}`}
            onClick={onClose}
            onTouchStart={(e) => { toqueX.current = e.touches[0].clientX }}
            onTouchEnd={(e) => {
                if (toqueX.current === null) return
                const dx = e.changedTouches[0].clientX - toqueX.current
                toqueX.current = null
                if (Math.abs(dx) > 50) {
                    if (dx > 0) anterior()
                    else proxima()
                }
            }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
        >
            <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                autoFocus
                className="absolute top-4 right-4 z-10 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
            >
                <X className="h-6 w-6" />
            </button>

            <div className="relative w-full h-full max-w-4xl max-h-[78vh]" onClick={(e) => e.stopPropagation()}>
                {foto.src && (
                    <Image
                        key={foto.id}
                        src={foto.src}
                        alt={`${nome} — ${TIPOS_FOTO[foto.tipo]}`}
                        fill
                        sizes="(max-width: 896px) 100vw, 896px"
                        className="object-contain"
                        quality={90}
                    />
                )}
            </div>

            <div className="mt-4 text-center text-white space-y-1" onClick={(e) => e.stopPropagation()}>
                <p className="font-semibold">
                    {TIPOS_FOTO[foto.tipo]}
                    {fotos.length > 1 && <span className="ml-2 text-white/60 font-normal">{indice + 1} / {fotos.length}</span>}
                </p>
                {foto.legenda && <p className="text-sm text-white/80">{foto.legenda}</p>}
            </div>

            {fotos.length > 1 && (
                <>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); anterior() }}
                        aria-label="Foto anterior"
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full text-white hover:bg-white/20"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); proxima() }}
                        aria-label="Próxima foto"
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full text-white hover:bg-white/20"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </>
            )}
        </div>
    )
}
