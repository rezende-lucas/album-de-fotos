'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center space-y-4 max-w-sm">
                <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                    <AlertTriangle className="h-8 w-8" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Algo deu errado</h1>
                <p className="text-sm text-gray-500">
                    Não foi possível carregar os dados. Verifique sua conexão e tente novamente.
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        type="button"
                        onClick={reset}
                        className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        Tentar novamente
                    </button>
                    <Link
                        href="/"
                        className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Início
                    </Link>
                </div>
            </div>
        </div>
    )
}
