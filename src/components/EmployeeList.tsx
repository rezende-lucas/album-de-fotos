'use client'

import { useState, useMemo } from 'react'
import { Funcionario } from '@/types'
import EmployeeCard from '@/components/EmployeeCard'
import SearchBar from '@/components/SearchBar'
import { Plus } from 'lucide-react'
import Link from 'next/link'

interface EmployeeListProps {
    initialFuncionarios: Funcionario[]
}

export default function EmployeeList({ initialFuncionarios }: EmployeeListProps) {
    const [query, setQuery] = useState('')

    const filteredFuncionarios = useMemo(() => {
        if (!query) return initialFuncionarios
        const lowerQuery = query.toLowerCase()
        return initialFuncionarios.filter(f => {
            const searchStr = [
                f.nome_completo,
                f.apelido,
                f.cpf,
                f.rg,
                f.nome_mae,
                f.nome_pai,
                f.logradouro,
                f.bairro,
                f.cidade
            ].filter(Boolean).join(' ').toLowerCase()

            return searchStr.includes(lowerQuery)
        })
    }, [initialFuncionarios, query])

    return (
        <>
            <div className="sticky top-0 bg-gray-50 pt-4 pb-2 z-10 px-4 mb-2">
                <SearchBar onSearch={setQuery} />
            </div>

            <div className="px-4 pb-24 space-y-3">
                {filteredFuncionarios.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        Nenhum abordado encontrado.
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
                aria-label="Adicionar Abordado"
            >
                <Plus className="h-8 w-8" />
            </Link>
        </>
    )
}
