'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { History, Trash2, Users } from 'lucide-react'

const TABS = [
    { href: '/admin/lixeira', label: 'Lixeira', icon: Trash2 },
    { href: '/admin/auditoria', label: 'Auditoria', icon: History },
    { href: '/admin/usuarios', label: 'Usuários', icon: Users },
]

export default function AdminNav() {
    const pathname = usePathname()

    return (
        <nav className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto no-scrollbar" aria-label="Seções da administração">
            {TABS.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href)
                return (
                    <Link
                        key={href}
                        href={href}
                        aria-current={active ? 'page' : undefined}
                        className={`flex items-center gap-2 px-3 py-3 text-sm font-semibold border-b-2 transition-colors ${active
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                            : 'border-transparent text-fg-muted hover:text-fg'}`}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </Link>
                )
            })}
        </nav>
    )
}
