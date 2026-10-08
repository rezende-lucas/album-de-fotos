import type { SupabaseClient } from '@supabase/supabase-js'

export const PHOTO_BUCKET = 'fotos-funcionarios'

const SIGNED_URL_TTL_SECONDS = 60 * 60

/**
 * `foto_url` guarda o caminho do arquivo no bucket. Registros antigos guardam a
 * URL pública completa; nesse caso extraímos o caminho a partir dela.
 */
export function getPhotoPath(fotoUrl: string | null | undefined): string | null {
    if (!fotoUrl) return null
    if (!/^https?:\/\//.test(fotoUrl)) return fotoUrl

    const marker = `/${PHOTO_BUCKET}/`
    const index = fotoUrl.indexOf(marker)
    if (index === -1) return null
    return decodeURIComponent(fotoUrl.slice(index + marker.length).split('?')[0])
}

/** Gera URLs assinadas (bucket privado) em lote. Retorna mapa caminho → URL. */
export async function getSignedPhotoUrls(
    supabase: SupabaseClient,
    fotoUrls: (string | null | undefined)[]
): Promise<Record<string, string>> {
    const paths = [...new Set(fotoUrls.map(getPhotoPath).filter((p): p is string => !!p))]
    if (paths.length === 0) return {}

    const { data, error } = await supabase.storage
        .from(PHOTO_BUCKET)
        .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS)

    if (error || !data) {
        console.error('Erro ao assinar URLs das fotos:', error)
        return {}
    }

    const urls: Record<string, string> = {}
    for (const item of data) {
        if (item.path && item.signedUrl) urls[item.path] = item.signedUrl
    }
    return urls
}

export async function getSignedPhotoUrl(
    supabase: SupabaseClient,
    fotoUrl: string | null | undefined
): Promise<string | null> {
    const path = getPhotoPath(fotoUrl)
    if (!path) return null
    const urls = await getSignedPhotoUrls(supabase, [path])
    return urls[path] ?? null
}

/** Remove a foto do storage. Falhas são apenas registradas (não bloqueiam o fluxo). */
export async function removePhoto(supabase: SupabaseClient, fotoUrl: string | null | undefined) {
    const path = getPhotoPath(fotoUrl)
    if (!path) return
    const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([path])
    if (error) console.error('Erro ao remover foto antiga:', error)
}
