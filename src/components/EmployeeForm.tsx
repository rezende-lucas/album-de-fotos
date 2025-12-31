'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import CameraInput from '@/components/CameraInput'
import { Loader2, Save } from 'lucide-react'
import { Funcionario } from '@/types'

const schema = z.object({
    nome_completo: z.string().min(3, 'Nome min. 3 chars'),
    apelido: z.string().optional(),
    nome_mae: z.string().min(3, 'Nome da mãe obrigatório'),
    nome_pai: z.string().optional(),
    cpf: z.string().min(11, 'CPF inválido'),
    rg: z.string().optional(),
    // Address
    cep: z.string().min(8, 'CEP inválido'),
    logradouro: z.string().min(3, 'Rua obrigatória'),
    numero: z.string().min(1, 'Número obrigatório'),
    complemento: z.string().optional(),
    bairro: z.string().min(3, 'Bairro obrigatório'),
    cidade: z.string().min(3, 'Cidade obrigatória'),
    estado: z.string().length(2, 'Estado (UF) inválido'),
})

type FormData = z.infer<typeof schema>

interface EmployeeFormProps {
    initialData?: Funcionario
    onSuccess?: () => void
}

export default function EmployeeForm({ initialData, onSuccess }: EmployeeFormProps) {
    const [photo, setPhoto] = useState<File | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [loadingCep, setLoadingCep] = useState(false)
    const [errorHeader, setErrorHeader] = useState<string | null>(null)

    const router = useRouter()
    const supabase = createClient()

    // Default values if editing
    const defaultValues: Partial<FormData> = initialData ? {
        nome_completo: initialData.nome_completo,
        apelido: initialData.apelido || '',
        nome_mae: initialData.nome_mae || '',
        nome_pai: initialData.nome_pai || '',
        cpf: initialData.cpf,
        rg: initialData.rg || '',
        cep: initialData.cep || '',
        logradouro: initialData.logradouro || '',
        numero: initialData.numero || '',
        complemento: initialData.complemento || '',
        bairro: initialData.bairro || '',
        cidade: initialData.cidade || '',
        estado: initialData.estado || '',
    } : {}

    const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues
    })

    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, '')
        if (cep.length !== 8) return

        setLoadingCep(true)
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
            const data = await response.json()

            if (!data.erro) {
                setValue('logradouro', data.logradouro)
                setValue('bairro', data.bairro)
                setValue('cidade', data.localidade)
                setValue('estado', data.uf)
            }
        } catch (error) {
            console.error('Erro ao buscar CEP', error)
        } finally {
            setLoadingCep(false)
        }
    }

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true)
        setErrorHeader(null)

        try {
            let foto_url = initialData?.foto_url || null

            if (photo) {
                const fileExt = photo.name.split('.').pop()
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('fotos-funcionarios')
                    .upload(fileName, photo)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('fotos-funcionarios')
                    .getPublicUrl(fileName)

                foto_url = publicUrl
            }

            if (initialData?.id) {
                // Update
                const { error: updateError } = await supabase
                    .from('funcionarios')
                    .update({ ...data, foto_url })
                    .eq('id', initialData.id)

                if (updateError) throw updateError
            } else {
                // Insert
                const { error: insertError } = await supabase
                    .from('funcionarios')
                    .insert({ ...data, foto_url })

                if (insertError) throw insertError
            }

            router.push('/')
            router.refresh()
            if (onSuccess) onSuccess()

        } catch (err: any) {
            console.error(err)
            if (err.code === '23505') {
                setErrorHeader("Este CPF já está cadastrado.")
            } else {
                setErrorHeader(err.message || "Erro ao salvar")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            {errorHeader && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm mb-6">
                    {errorHeader}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Dados Pessoais</h2>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <div className="flex justify-center mb-6">
                            <CameraInput onImageSelected={setPhoto} initialPreview={initialData?.foto_url || undefined} />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="label">Nome Completo *</label>
                                <input {...register('nome_completo')} className="input" placeholder="Nome Completo" />
                                {errors.nome_completo && <span className="error">{errors.nome_completo.message}</span>}
                            </div>
                            <div>
                                <label className="label">Apelido</label>
                                <input {...register('apelido')} className="input" placeholder="Como gosta de ser chamado" />
                            </div>
                            <div>
                                <label className="label">CPF *</label>
                                <input
                                    {...register('cpf')}
                                    className="input"
                                    placeholder="000.000.000-00"
                                    onChange={(e) => {
                                        let v = e.target.value.replace(/\D/g, '')
                                        v = v.replace(/(\d{3})(\d)/, '$1.$2')
                                        v = v.replace(/(\d{3})(\d)/, '$1.$2')
                                        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
                                        setValue('cpf', v.slice(0, 14))
                                    }}
                                    maxLength={14}
                                />
                                {errors.cpf && <span className="error">{errors.cpf.message}</span>}
                            </div>
                            <div>
                                <label className="label">RG</label>
                                <input {...register('rg')} className="input" />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Filiação</h2>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <div>
                            <label className="label">Nome da Mãe *</label>
                            <input {...register('nome_mae')} className="input" />
                            {errors.nome_mae && <span className="error">{errors.nome_mae.message}</span>}
                        </div>
                        <div>
                            <label className="label">Nome do Pai</label>
                            <input {...register('nome_pai')} className="input" />
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Endereço</h2>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                        <div className="grid grid-cols-6 gap-4">
                            <div className="col-span-3">
                                <label className="label">CEP *</label>
                                <div className="relative">
                                    <input
                                        {...register('cep')}
                                        className="input"
                                        onBlur={handleCepBlur}
                                        placeholder="00000-000"
                                        maxLength={9}
                                    />
                                    {loadingCep && <div className="absolute right-3 top-3"><Loader2 className="h-4 w-4 animate-spin text-blue-500" /></div>}
                                </div>
                                {errors.cep && <span className="error">{errors.cep.message}</span>}
                            </div>
                            <div className="col-span-3">
                                <label className="label">Cidade *</label>
                                <input {...register('cidade')} className="input bg-gray-50" readOnly />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-12 sm:col-span-9">
                                <label className="label">Rua / Logradouro *</label>
                                <input {...register('logradouro')} className="input" />
                                {errors.logradouro && <span className="error">{errors.logradouro.message}</span>}
                            </div>
                            <div className="col-span-6 sm:col-span-3">
                                <label className="label">Número *</label>
                                <input {...register('numero')} className="input" />
                                {errors.numero && <span className="error">{errors.numero.message}</span>}
                            </div>
                            <div className="col-span-6 sm:col-span-3">
                                <label className="label">UF *</label>
                                <input {...register('estado')} className="input bg-gray-50" readOnly maxLength={2} />
                            </div>
                            <div className="col-span-12 sm:col-span-9">
                                <label className="label">Bairro *</label>
                                <input {...register('bairro')} className="input" />
                            </div>
                        </div>

                        <div>
                            <label className="label">Complemento</label>
                            <input {...register('complemento')} className="input" />
                        </div>
                    </div>
                </section>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sticky bottom-6 flex justify-center items-center gap-2 py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 active:scale-[0.98] transition-all disabled:opacity-70"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save className="h-5 w-5" /> Salvar</>}
                </button>
            </form>

            <style jsx>{`
            .label {
              @apply block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide;
            }
            .input {
              @apply w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900;
            }
            .error {
              @apply text-red-500 text-xs mt-1 block;
            }
          `}</style>
        </>
    )
}
