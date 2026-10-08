import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getPerfil } from '@/lib/auth'
import AdminNav from '@/components/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const perfil = await getPerfil()
    if (!perfil) redirect('/login')
    if (perfil.papel !== 'admin') redirect('/')

    return (
        <div className="min-h-screen bg-page pb-safe">
            <header className="bg-surface border-b border-line sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 pt-4 flex items-center gap-3">
                    <Link href="/" className="p-2 -ml-2 text-fg-soft hover:bg-surface-muted rounded-full" aria-label="Voltar">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <h1 className="text-lg font-bold text-fg">Administração</h1>
                </div>
                <AdminNav />
            </header>
            <main className="max-w-4xl mx-auto p-4">{children}</main>
        </div>
    )
}
