'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, LocateFixed, X } from 'lucide-react'
import MiniMapa from '@/components/MiniMapa'

export interface Coordenadas {
    latitude: number
    longitude: number
    precisao: number | null
}

interface LocationPickerProps {
    value: Coordenadas | null
    onChange: (coords: Coordenadas | null) => void
    /** Endereço aproximado encontrado para o ponto (para preencher o campo "Local"). */
    onEndereco?: (endereco: string) => void
    /** Captura automaticamente se a permissão de localização já foi concedida. */
    autoCapturar?: boolean
}

const ERROS: Record<number, string> = {
    1: 'Permissão de localização negada. Libere nas configurações do navegador ou digite o local.',
    2: 'Não foi possível obter a localização. Verifique o GPS ou digite o local.',
    3: 'A localização demorou demais. Tente de novo ou digite o local.',
}

/** Endereço aproximado pelo OpenStreetMap (Nominatim). Falhas são ignoradas. */
async function enderecoAproximado(lat: number, lon: number): Promise<string | null> {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=pt-BR`
        const res = await fetch(url, { headers: { Accept: 'application/json' } })
        if (!res.ok) return null
        const data = await res.json()
        const a = data.address ?? {}
        const rua = [a.road ?? a.pedestrian ?? a.footway, a.house_number].filter(Boolean).join(', ')
        const bairro = a.suburb ?? a.neighbourhood ?? a.quarter
        const cidade = a.city ?? a.town ?? a.village ?? a.municipality
        const partes = [rua, bairro, cidade].filter(Boolean)
        return partes.length > 0 ? partes.join(' - ') : (data.display_name ?? null)
    } catch {
        return null
    }
}

export default function LocationPicker({ value, onChange, onEndereco, autoCapturar = false }: LocationPickerProps) {
    const [buscando, setBuscando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const iniciou = useRef(false)

    const capturar = () => {
        if (!('geolocation' in navigator)) {
            setErro('Este aparelho não oferece localização. Digite o local.')
            return
        }
        setBuscando(true)
        setErro(null)
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const coords = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    precisao: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
                }
                onChange(coords)
                setBuscando(false)
                const endereco = await enderecoAproximado(coords.latitude, coords.longitude)
                if (endereco) onEndereco?.(endereco)
            },
            (err) => {
                setErro(ERROS[err.code] ?? ERROS[2])
                setBuscando(false)
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        )
    }

    // Se a permissão já foi dada antes, captura sem precisar tocar no botão
    useEffect(() => {
        if (!autoCapturar || value || iniciou.current || !navigator.permissions) return
        iniciou.current = true
        navigator.permissions.query({ name: 'geolocation' }).then((status) => {
            if (status.state === 'granted') capturar()
        }).catch(() => {})
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoCapturar])

    return (
        <div className="space-y-2">
            {value ? (
                <>
                    <MiniMapa latitude={value.latitude} longitude={value.longitude} precisao={value.precisao} />
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={capturar}
                            disabled={buscando}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold bg-surface-muted text-fg-soft hover:bg-line-strong disabled:opacity-60"
                        >
                            {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                            Atualizar localização
                        </button>
                        <button
                            type="button"
                            onClick={() => onChange(null)}
                            className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold bg-surface-muted text-fg-soft hover:bg-line-strong"
                        >
                            <X className="h-4 w-4" /> Remover
                        </button>
                    </div>
                </>
            ) : (
                <button
                    type="button"
                    onClick={capturar}
                    disabled={buscando}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold border-2 border-dashed border-line-strong text-blue-600 dark:text-blue-400 hover:border-blue-500 disabled:opacity-60"
                >
                    {buscando ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />}
                    {buscando ? 'Obtendo localização...' : 'Usar minha localização (GPS)'}
                </button>
            )}
            {erro && <p role="alert" className="text-amber-600 dark:text-amber-400 text-xs">{erro}</p>}
        </div>
    )
}
