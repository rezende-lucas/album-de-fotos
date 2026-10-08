import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Ban, Clock, RefreshCw } from 'lucide-react'
import { getPerfil } from '@/lib/auth'
import LogoutButton from '@/components/LogoutButton'
import { formatDateTime } from '@/lib/format'

export const metadata = { title: 'Aguardando aprovação · Registro de Abordados' }

const MENSAGENS = {
    pendente: {
        titulo: 'Cadastro em análise',
        texto: 'Um administrador vai conferir sua funcional e liberar o acesso. Volte mais tarde ou toque em "Verificar novamente".',
    },
    recusado: {
        titulo: 'Cadastro não aprovado',
        texto: 'Seu pedido de acesso não foi aprovado. Se acha que houve engano, procure um administrador.',
    },
    bloqueado: {
        titulo: 'Acesso bloqueado',
        texto: 'Seu acesso foi bloqueado por um administrador. Procure a administração para mais informações.',
    },
} as const

export default async function AguardandoPage() {
    const perfil = await getPerfil()
    if (!perfil) redirect('/login')
    if (!perfil.status || perfil.status === 'ativo') redirect('/')

    const mensagem = MENSAGENS[perfil.status]
    const pendente = perfil.status === 'pendente'

    return (
        <div className="flex items-center justify-center min-h-screen bg-page px-4">
            <div className="w-full max-w-md bg-surface p-8 rounded-2xl shadow-lg border border-line text-center space-y-4">
                <div className={`mx-auto h-14 w-14 rounded-full flex items-center justify-center ${pendente
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300'}`}>
                    {pendente ? <Clock className="h-7 w-7" /> : <Ban className="h-7 w-7" />}
                </div>
                <h1 className="text-2xl font-bold text-fg">{mensagem.titulo}</h1>
                {perfil.nome && <p className="text-fg-soft">Olá, {perfil.nome.split(' ')[0]}.</p>}
                <p className="text-sm text-fg-muted">{mensagem.texto}</p>
                {perfil.created_at && (
                    <p className="text-xs text-fg-subtle">Cadastro enviado em {formatDateTime(perfil.created_at)}</p>
                )}
                <div className="flex items-center justify-center gap-3 pt-2">
                    {pendente && (
                        <Link
                            href="/aguardando"
                            prefetch={false}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        >
                            <RefreshCw className="h-4 w-4" /> Verificar novamente
                        </Link>
                    )}
                    <LogoutButton />
                </div>
            </div>
        </div>
    )
}
