import imageCompression from 'browser-image-compression'
import type { SupabaseClient } from '@supabase/supabase-js'
import { PHOTO_BUCKET, getPhotoPath, removePhotos } from '@/lib/photos'
import type { FotoView, TipoFoto } from '@/types'

/** Foto no formulário: existente (id), legada (só caminho) ou nova (file). */
export interface PhotoDraft {
    key: string
    id?: string
    caminho?: string
    miniatura?: string | null
    file?: File
    thumbFile?: File
    previewUrl: string | null
    tipo: TipoFoto
    legenda: string
    principal: boolean
}

export const MAX_FOTOS = 20

/**
 * Comprime a foto (até 1600 px) e gera a miniatura (320 px) no navegador.
 * useWebWorker fica desligado: o worker da biblioteca baixa código do CDN jsDelivr em
 * tempo de execução (terceiro externo e falha sem internet).
 */
export async function prepararFoto(original: File): Promise<{ file: File, thumbFile: File }> {
    const file = await imageCompression(original, { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: false })
    const thumbFile = await imageCompression(file, {
        maxSizeMB: 0.05,
        maxWidthOrHeight: 320,
        useWebWorker: false,
        fileType: 'image/jpeg',
    })
    return { file, thumbFile }
}

export function draftsIniciais(fotos: FotoView[], legadoFotoUrl?: string | null, legadoSrc?: string | null): PhotoDraft[] {
    if (fotos.length === 0 && legadoFotoUrl) {
        // Cadastro antigo sem linhas em `fotos`: a foto única vira a principal ao salvar
        return [{ key: 'legado', caminho: getPhotoPath(legadoFotoUrl) ?? undefined, previewUrl: legadoSrc ?? null, tipo: 'rosto', legenda: '', principal: true }]
    }
    return fotos.map((f) => ({
        key: f.id,
        id: f.id,
        caminho: f.caminho,
        miniatura: f.miniatura,
        previewUrl: f.thumbSrc ?? f.src,
        tipo: f.tipo,
        legenda: f.legenda ?? '',
        principal: f.principal,
    }))
}

function extensao(file: File) {
    const subtype = file.type.split('/')[1]
    if (!subtype) return 'jpg'
    return subtype === 'jpeg' ? 'jpg' : subtype
}

async function upload(supabase: SupabaseClient, file: File, pasta = '') {
    const nome = `${pasta}${Date.now()}-${Math.random().toString(36).substring(2)}.${extensao(file)}`
    const { error } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(nome, file, { contentType: file.type || 'image/jpeg' })
    if (error) throw error
    return nome
}

/**
 * Sincroniza o álbum do cadastro com o que está no formulário:
 * remove as fotos tiradas, troca a principal, atualiza tipo/legenda/ordem e envia as novas.
 * Os arquivos das fotos removidas são apagados do storage só no final, com tudo salvo.
 */
export async function salvarFotos(
    supabase: SupabaseClient,
    funcionarioId: string,
    drafts: PhotoDraft[],
    iniciais: PhotoDraft[],
    opcoes: { abordagemId?: string, ordemBase?: number } = {}
) {
    const removidas = iniciais.filter((i) => i.id && !drafts.some((d) => d.id === i.id))
    if (removidas.length > 0) {
        const { error } = await supabase.from('fotos').delete().in('id', removidas.map((r) => r.id!))
        if (error) throw error
    }

    // Só pode haver uma principal: desmarca a antiga antes de marcar a nova
    const principalAntiga = iniciais.find((i) => i.id && i.principal && drafts.some((d) => d.id === i.id))
    const novaPrincipal = drafts.find((d) => d.principal)
    if (principalAntiga && novaPrincipal?.id !== principalAntiga.id) {
        const { error } = await supabase.from('fotos').update({ principal: false }).eq('id', principalAntiga.id!)
        if (error) throw error
    }

    const enviados: string[] = []
    try {
        for (const [ordem, draft] of drafts.entries()) {
            const campos = { tipo: draft.tipo, legenda: draft.legenda.trim() || null, principal: draft.principal, ordem: (opcoes.ordemBase ?? 0) + ordem }

            if (draft.id) {
                const inicial = iniciais.find((i) => i.id === draft.id)
                const mudou = !inicial || inicial.tipo !== draft.tipo || inicial.legenda !== draft.legenda
                    || inicial.principal !== draft.principal || iniciais.indexOf(inicial) !== ordem
                if (!mudou) continue
                const { error } = await supabase.from('fotos').update(campos).eq('id', draft.id)
                if (error) throw error
                continue
            }

            let caminho = draft.caminho
            let miniatura = draft.miniatura ?? null
            if (draft.file) {
                caminho = await upload(supabase, draft.file)
                enviados.push(caminho)
                if (draft.thumbFile) {
                    miniatura = await upload(supabase, draft.thumbFile, 'miniaturas/')
                    enviados.push(miniatura)
                }
            }
            if (!caminho) continue

            const { error } = await supabase
                .from('fotos')
                .insert({ ...campos, funcionario_id: funcionarioId, caminho, miniatura, abordagem_id: opcoes.abordagemId ?? null })
            if (error) throw error
        }
    } catch (err) {
        // Arquivos enviados nesta tentativa cujas linhas podem não ter sido criadas
        const { data } = await supabase.from('fotos').select('caminho, miniatura').eq('funcionario_id', funcionarioId)
        const emUso = new Set((data ?? []).flatMap((f) => [f.caminho, f.miniatura]))
        await removePhotos(supabase, enviados.filter((p) => !emUso.has(p)))
        throw err
    }

    // Foto legada (sem linha em `fotos`) removida no formulário
    const legado = iniciais.find((i) => !i.id && i.caminho)
    if (legado && !drafts.some((d) => d.key === legado.key)) {
        const { error } = await supabase.from('funcionarios').update({ foto_url: null, foto_miniatura: null }).eq('id', funcionarioId)
        if (error) throw error
        removidas.push(legado)
    }

    await removePhotos(supabase, removidas.flatMap((r) => [r.caminho, r.miniatura]))
}
