'use client'

import type { Dispatch, SetStateAction } from 'react'
import LocationPicker from '@/components/LocationPicker'
import { MOTIVOS_SUGERIDOS, type AbordagemDraft } from '@/lib/abordagens'
import { toDateTimeLocal } from '@/lib/format'

interface AbordagemFieldsProps {
    value: AbordagemDraft
    /** setState do formulário (atualizações funcionais: o endereço do GPS chega depois). */
    onChange: Dispatch<SetStateAction<AbordagemDraft>>
    autoCapturarLocal?: boolean
}

/** Campos da abordagem: data/hora, local (GPS + texto), motivo e observações. */
export default function AbordagemFields({ value, onChange, autoCapturarLocal = false }: AbordagemFieldsProps) {
    const set = (campos: Partial<AbordagemDraft>) => onChange((d) => ({ ...d, ...campos }))
    const coords = value.latitude !== null && value.longitude !== null
        ? { latitude: value.latitude, longitude: value.longitude, precisao: value.precisao }
        : null

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="abordagem_data" className="label">Data e hora *</label>
                <input
                    id="abordagem_data"
                    type="datetime-local"
                    value={value.dataHora}
                    max={toDateTimeLocal(new Date())}
                    onChange={(e) => set({ dataHora: e.target.value })}
                    className="input"
                    required
                />
            </div>

            <div className="space-y-2">
                <span className="label">Local *</span>
                <LocationPicker
                    value={coords}
                    autoCapturar={autoCapturarLocal}
                    onChange={(c) => set({ latitude: c?.latitude ?? null, longitude: c?.longitude ?? null, precisao: c?.precisao ?? null })}
                    // Preenche o campo só se ainda estiver vazio (não apaga o que o agente digitou)
                    onEndereco={(endereco) => onChange((d) => ({ ...d, local: d.local || endereco }))}
                />
                <input
                    id="abordagem_local"
                    aria-label="Descrição do local"
                    value={value.local}
                    onChange={(e) => set({ local: e.target.value })}
                    placeholder="Rua, número, ponto de referência…"
                    className="input"
                    autoComplete="off"
                />
            </div>

            <div>
                <label htmlFor="abordagem_motivo" className="label">Motivo</label>
                <input
                    id="abordagem_motivo"
                    list="abordagem_motivos"
                    value={value.motivo}
                    onChange={(e) => set({ motivo: e.target.value })}
                    placeholder="Ex.: Patrulhamento de rotina"
                    className="input"
                    autoComplete="off"
                />
                <datalist id="abordagem_motivos">
                    {MOTIVOS_SUGERIDOS.map((m) => <option key={m} value={m} />)}
                </datalist>
            </div>

            <div>
                <label htmlFor="abordagem_obs" className="label">Observações</label>
                <textarea
                    id="abordagem_obs"
                    value={value.observacoes}
                    onChange={(e) => set({ observacoes: e.target.value })}
                    rows={4}
                    placeholder="O que aconteceu, com quem estava, objetos encontrados…"
                    className="input resize-y"
                />
            </div>
        </div>
    )
}
