import { ExternalLink } from 'lucide-react'

interface MiniMapaProps {
    latitude: number
    longitude: number
    precisao?: number | null
    className?: string
}

export function linkMapa(latitude: number, longitude: number) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
}

/** Mapa do OpenStreetMap com um marcador no ponto (iframe, sem chave de API). */
export default function MiniMapa({ latitude, longitude, precisao, className = '' }: MiniMapaProps) {
    const d = 0.004
    const bbox = [longitude - d, latitude - d * 0.6, longitude + d, latitude + d * 0.6].map((n) => n.toFixed(6)).join(',')
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`

    return (
        <div className={`space-y-1 ${className}`}>
            <iframe
                title="Mapa do local da abordagem"
                src={src}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-40 rounded-xl border border-line bg-surface-muted"
            />
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-fg-subtle">
                <span className="font-mono">
                    {latitude.toFixed(5)}, {longitude.toFixed(5)}
                    {precisao ? ` · ±${Math.round(precisao)} m` : ''}
                </span>
                <a
                    href={linkMapa(latitude, longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium whitespace-nowrap"
                >
                    Abrir no mapa <ExternalLink className="h-3 w-3" />
                </a>
            </div>
        </div>
    )
}
