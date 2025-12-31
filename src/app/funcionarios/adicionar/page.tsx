'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import EmployeeForm from '@/components/EmployeeForm'

export default function AddEmployeePage() {
    return (
        <div className="min-h-screen bg-gray-50 pb-safe">
            <header className="bg-white shadow-sm sticky top-0 z-10 px-4 py-4 flex items-center gap-3">
                <Link href="/" className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-lg font-bold text-gray-900">Novo Abordado</h1>
            </header>

            <main className="p-4 max-w-lg mx-auto">
                <EmployeeForm />
            </main>
        </div>
    )
}
