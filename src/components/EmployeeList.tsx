'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { FuncionarioListItem } from '@/types'
import EmployeeCard from '@/components/EmployeeCard'
import SearchBar from '@/components/SearchBar'
import { Loader2, Siren } from 'lucide-react'
import Link from 'next/link'
import { buscarFuncionariosAction } from '@/app/actions'
import type { CidadeResumo } from '@/lib/funcionarios'
import { useToast } from '@/components/Toast'

interface EmployeeListProps {
    initialItems: FuncionarioListItem[]
    initialTotal: number
    cidades: CidadeResumo[]
}

const SEARCH_DEBOUNCE_MS = 300

export default function EmployeeList({ initialItems, initialTotal, cidades }: EmployeeListProps) {
    const [items, setItems] = useState(initialItems)
    const [total, setTotal] = useState(initialTotal)
    const [query, setQuery] = useState('')
    const [cidade, setCidade] = useState<string | null>(null)
    const [loading, setLoading] = useState<'search' | 'more' | null>(null)
    const showToast = useToast()

    // Descarta respostas antigas quando o usuário digita rápido
    const requestId = useRef(0)
    const sentinelRef = useRef<HTMLDivElement>(null)
    const isFirstRender = useRef(true)

    const hasMore = items.length < total
    const isFiltering = query.trim().length > 0 || cidade !== null

    const fetchPage = useCallback(async (offset: number) => {
        const id = ++requestId.current
        setLoading(offset === 0 ? 'search' : 'more')
        try {
            const result = await buscarFuncionariosAction({ termo: query.trim(), cidade, offset })
            if (id !== requestId.current) return
            setItems((current) => (offset === 0 ? result.items : [...current, ...result.items]))
            setTotal(result.total)
        } catch (error) {
            console.error(error)
            if (id === requestId.current) showToast('Erro ao buscar abordados', 'error')
        } finally {
            if (id === requestId.current) setLoading(null)
        }
    }, [query, cidade, showToast])

    // Nova busca (com debounce) quando muda o termo ou a cidade
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        const timeout = setTimeout(() => fetchPage(0), SEARCH_DEBOUNCE_MS)
        return () => clearTimeout(timeout)
    }, [fetchPage])

    // Rolagem infinita: carrega a próxima página quando o final da lista aparece
    useEffect(() => {
        const sentinel = sentinelRef.current
        if (!sentinel || !hasMore || loading) return

        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) fetchPage(items.length)
        }, { rootMargin: '400px' })
        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [hasMore, loading, items.length, fetchPage])

    return (
        <>
            <div className="sticky top-0 bg-page pt-4 pb-2 z-10 px-4 mb-2 space-y-2">
                <SearchBar onSearch={setQuery} />

                {cidades.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4" role="group" aria-label="Filtrar por cidade">
                        <FilterChip active={cidade === null} onClick={() => setCidade(null)}>
                            Todas
                        </FilterChip>
                        {cidades.map((c) => (
                            <FilterChip key={c.cidade} active={cidade === c.cidade} onClick={() => setCidade(c.cidade)}>
                                {c.cidade} <span className="opacity-60">{c.total}</span>
                            </FilterChip>
                        ))}
                    </div>
                )}

                {isFiltering && (
                    <p className="text-xs text-fg-muted px-1" aria-live="polite">
                        {total} {total === 1 ? 'encontrado' : 'encontrados'}
                    </p>
                )}
            </div>

            <div className="px-4 pb-24">
                {items.length === 0 && loading !== 'search' ? (
                    <div className="text-center py-10 text-fg-subtle">
                        {isFiltering ? 'Nenhum abordado encontrado.' : 'Nenhum abordado cadastrado ainda. Registre a primeira abordagem.'}
                    </div>
                ) : (
                    <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 transition-opacity ${loading === 'search' ? 'opacity-60' : ''}`}>
                        {items.map((func) => (
                            <EmployeeCard key={func.id} funcionario={func} />
                        ))}
                    </div>
                )}

                <div ref={sentinelRef} className="h-px" />
                {(loading === 'more' || (loading === 'search' && items.length === 0)) && (
                    <div className="flex justify-center py-6 text-fg-subtle" aria-label="Carregando">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                )}
            </div>

            {/* FAB - Floating Action Button (no desktop o botão fica no header) */}
            <Link
                href="/abordagens/nova"
                className="sm:hidden fixed bottom-6 right-6 h-14 w-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-all z-20"
                style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
                aria-label="Nova abordagem"
            >
                <Siren className="h-7 w-7" />
            </Link>
        </>
    )
}

function FilterChip({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${active
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-surface border-line-strong text-fg-soft hover:bg-surface-muted'}`}
        >
            {children}
        </button>
    )
}
