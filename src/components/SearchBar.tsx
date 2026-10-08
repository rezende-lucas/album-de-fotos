'use client'

import { Search } from 'lucide-react'

interface SearchBarProps {
    onSearch: (query: string) => void
}

export default function SearchBar({ onSearch }: SearchBarProps) {
    return (
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-fg-subtle" />
            </div>
            <input
                type="search"
                aria-label="Buscar abordados"
                placeholder="Buscar por nome, CPF, endereço..."
                onChange={(e) => onSearch(e.target.value)}
                autoComplete="off"
                className="block w-full pl-10 pr-3 py-3 border border-line-strong rounded-xl leading-5 bg-page text-base placeholder-fg-subtle focus:outline-none focus:bg-surface focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
            />
        </div>
    )
}
