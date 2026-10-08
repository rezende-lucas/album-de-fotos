import Link from 'next/link'
import { SearchX } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center space-y-4">
                <div className="mx-auto h-16 w-16 bg-surface-muted rounded-full flex items-center justify-center text-fg-subtle">
                    <SearchX className="h-8 w-8" />
                </div>
                <h1 className="text-xl font-bold text-fg">Registro não encontrado</h1>
                <p className="text-sm text-fg-muted">O abordado pode ter sido excluído ou o link está incorreto.</p>
                <Link
                    href="/"
                    className="inline-block px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                >
                    Voltar para a lista
                </Link>
            </div>
        </div>
    )
}
