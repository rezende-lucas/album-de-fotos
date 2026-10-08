'use client'

import { useState, useMemo } from 'react'
import { FuncionarioListItem } from '@/types'
import EmployeeCard from '@/components/EmployeeCard'
import SearchBar from '@/components/SearchBar'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { normalizeText, onlyDigits } from '@/lib/format'

interface EmployeeListProps {
    initialFuncionarios: FuncionarioListItem[]
}

export default function EmployeeList({ initialFuncionarios }: EmployeeListProps) {
    const [query, setQuery] = useState('')

    // Texto de busca pré-normalizado (sem acentos) para cada registro
    const searchIndex = useMemo(() => initialFuncionarios.map((f) => ({
        funcionario: f,
        text: normalizeText([
            f.nome_completo,
            f.apelido,
            f.cpf,
            f.rg,
            f.nome_mae,
            f.nome_pai,
            f.logradouro,
            f.bairro,
            f.cidade,
            f.endereco,
        ].filter(Boolean).join(' ')),
        documents: `${onlyDigits(f.cpf)} ${onlyDigits(f.rg)}`,
    })), [initialFuncionarios])

    const filteredFuncionarios = useMemo(() => {
        const normalizedQuery = normalizeText(query.trim())
        if (!normalizedQuery) return initialFuncionarios

        const terms = normalizedQuery.split(/\s+/)
        const digitsQuery = onlyDigits(query)
        // Consulta só com números/pontuação (ex.: "123.456") busca também em CPF/RG sem máscara
        const isDocumentQuery = digitsQuery.length >= 3 && /^[\d.\-\s/]+$/.test(query.trim())

        return searchIndex
            .filter(({ text, documents }) =>
                (isDocumentQuery && documents.includes(digitsQuery)) ||
                terms.every((term) => text.includes(term))
            )
            .map(({ funcionario }) => funcionario)
    }, [initialFuncionarios, searchIndex, query])

    const isFiltering = query.trim().length > 0

    return (
        <>
            <div className="sticky top-0 bg-gray-50 pt-4 pb-2 z-10 px-4 mb-2">
                <SearchBar onSearch={setQuery} />
                {isFiltering && (
                    <p className="text-xs text-gray-500 mt-2 px-1" aria-live="polite">
                        {filteredFuncionarios.length} de {initialFuncionarios.length}
                    </p>
                )}
            </div>

            <div className="px-4 pb-24 space-y-3">
                {filteredFuncionarios.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        {isFiltering ? 'Nenhum abordado encontrado.' : 'Nenhum abordado cadastrado ainda. Toque em + para adicionar.'}
                    </div>
                ) : (
                    filteredFuncionarios.map((func) => (
                        <EmployeeCard key={func.id} funcionario={func} />
                    ))
                )}
            </div>

            {/* FAB - Floating Action Button */}
            <Link
                href="/funcionarios/adicionar"
                className="fixed bottom-6 right-6 h-14 w-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-all z-20"
                style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
                aria-label="Adicionar Abordado"
            >
                <Plus className="h-8 w-8" />
            </Link>
        </>
    )
}
