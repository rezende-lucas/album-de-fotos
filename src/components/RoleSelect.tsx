'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'
import type { Papel } from '@/types'

export default function RoleSelect({ userId, papel }: { userId: string, papel: Papel }) {
    const router = useRouter()
    const showToast = useToast()
    const [value, setValue] = useState<Papel>(papel)
    const [saving, setSaving] = useState(false)

    const change = async (novo: Papel) => {
        const anterior = value
        setValue(novo)
        setSaving(true)
        const { data, error } = await createClient()
            .from('perfis')
            .update({ papel: novo })
            .eq('user_id', userId)
            .select('papel')
        setSaving(false)

        if (error || !data?.length) {
            setValue(anterior)
            showToast(error?.message || 'Não foi possível alterar o papel', 'error')
            return
        }
        showToast(novo === 'admin' ? 'Usuário agora é administrador' : 'Usuário agora é agente')
        router.refresh()
    }

    return (
        <select
            aria-label="Papel do usuário"
            value={value}
            disabled={saving}
            onChange={(e) => change(e.target.value as Papel)}
            className="px-3 py-2 rounded-xl bg-surface-muted border border-line-strong text-fg text-sm font-medium disabled:opacity-60"
        >
            <option value="agente">Agente</option>
            <option value="admin">Administrador</option>
        </select>
    )
}
