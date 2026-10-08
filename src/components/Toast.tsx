'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

type ToastType = 'success' | 'error'

interface ToastItem {
    id: number
    message: string
    type: ToastType
}

const ToastContext = createContext<(message: string, type?: ToastType) => void>(() => {})

/** Exibe avisos rápidos ("Cadastro salvo"). Fica no layout raiz, então sobrevive à navegação. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([])
    const nextId = useRef(0)

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = nextId.current++
        setToasts((current) => [...current, { id, message, type }])
        setTimeout(() => {
            setToasts((current) => current.filter((t) => t.id !== id))
        }, 3500)
    }, [])

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            <div
                role="status"
                aria-live="polite"
                className="fixed inset-x-0 bottom-24 sm:bottom-6 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none"
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                    >
                        {toast.type === 'success'
                            ? <CheckCircle2 className="h-5 w-5 text-green-400 dark:text-green-600 flex-shrink-0" />
                            : <XCircle className="h-5 w-5 text-red-400 dark:text-red-600 flex-shrink-0" />}
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    return useContext(ToastContext)
}
