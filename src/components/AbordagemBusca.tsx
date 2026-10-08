'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Loader2, Search, User, UserPlus } from 'lucide-react'
import { buscarFuncionariosAction } from '@/app/actions'
import { formatCpf, formatRelativeDate, onlyDigits } from '@/lib/format'
import type { FuncionarioListItem } from '@/types'

/** Passo 1 da abordagem: localizar a pessoa (por CPF ou nome) antes de registrar. */
export default function AbordagemBusca() {
    const [termo, setTermo] = useState('')
    const [resultados, setResultados] = useState<FuncionarioListItem[] | null>(null)
    const [buscando, setBuscando] = useState(false)
    const requestId = useRef(0)

    useEffect(() => {
        const consulta = termo.trim()
        if (consulta.length < 3) {
            requestId.current++
            setResultados(null)
            setBuscando(false)
            return
        }
        const id = ++requestId.current
        setBuscando(true)
        const timeout = setTimeout(async () => {
            try {
                const { items } = await buscarFuncionariosAction({ termo: consulta })
                if (id === requestId.current) setResultados(items)
            } catch (err) {
                console.error(err)
                if (id === requestId.current) setResultados([])
            } finally {
                if (id === requestId.current) setBuscando(false)
            }
        }, 300)
        return () => clearTimeout(timeout)
    }, [termo])

    const digitos = onlyDigits(termo)
    const pareceCpf = digitos.length === 11 && /^[\d.\-\s]+$/.test(termo.trim())
    const cadastrarHref = `/funcionarios/adicionar?abordagem=1&${pareceCpf ? `cpf=${digitos}` : `nome=${encodeURIComponent(termo.trim())}`}`

    return (
        <div className="space-y-4">
            <p className="text-sm text-fg-muted">
                Busque a pessoa abordada. Se ela já tiver cadastro, a abordagem entra no histórico dela.
            </p>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-subtle pointer-events-none" />
                <input
                    type="search"
                    autoFocus
                    aria-label="CPF ou nome da pessoa"
                    placeholder="CPF ou nome"
                    value={termo}
                    onChange={(e) => setTermo(e.target.value)}
                    autoComplete="off"
                    className="input pl-10"
                />
                {buscando && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-fg-subtle" />}
            </div>

            {resultados && resultados.length > 0 && (
                <ul className="bg-surface border border-line rounded-2xl divide-y divide-line overflow-hidden">
                    {resultados.map((f) => (
                        <li key={f.id}>
                            <Link href={`/funcionarios/${f.id}/abordagens/nova`} className="flex items-center gap-3 p-3 hover:bg-surface-muted transition-colors">
                                <div className="relative h-12 w-12 flex-shrink-0 rounded-full overflow-hidden bg-surface-muted">
                                    {f.foto_src
                                        ? <Image src={f.foto_src} alt="" fill sizes="48px" className="object-cover" />
                                        : <User className="h-6 w-6 m-3 text-fg-subtle" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-fg truncate">{f.nome_completo}</p>
                                    <p className="text-xs text-fg-muted">
                                        <span className="font-mono">{formatCpf(f.cpf)}</span>
                                        {f.ultima_abordagem_em && <> · última abordagem {formatRelativeDate(f.ultima_abordagem_em)}</>}
                                    </p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-fg-subtle flex-shrink-0" />
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            {resultados && resultados.length === 0 && (
                <p className="text-center text-sm text-fg-muted py-2">Ninguém encontrado com “{termo.trim()}”.</p>
            )}

            {resultados && (
                <Link
                    href={cadastrarHref}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold border-2 border-dashed border-line-strong text-blue-600 dark:text-blue-400 hover:border-blue-500"
                >
                    <UserPlus className="h-5 w-5" />
                    Pessoa não cadastrada? Cadastrar e registrar abordagem
                </Link>
            )}
        </div>
    )
}
