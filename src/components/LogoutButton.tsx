'use client'

import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <button
            onClick={handleLogout}
            className="p-2 text-fg-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-full transition-colors"
            title="Sair"
            aria-label="Sair"
        >
            <LogOut className="h-6 w-6" />
        </button>
    )
}
