'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import CameraInput from '@/components/CameraInput'
import { Loader2, Save } from 'lucide-react'
import { Funcionario } from '@/types'
import { formatCep, formatCpf, isValidCpf, onlyDigits } from '@/lib/format'
import { PHOTO_BUCKET, removePhoto } from '@/lib/photos'

const schema = z.object({
    nome_completo: z.string().trim().min(3, 'Nome deve ter ao menos 3 letras'),
    apelido: z.string().trim().optional(),
    nome_mae: z.string().trim().min(3, 'Nome da mãe obrigatório'),
    nome_pai: z.string().trim().optional(),
    cpf: z.string().refine(isValidCpf, 'CPF inválido'),
    rg: z.string().trim().optional(),
    // Address
    cep: z.string().refine((v) => onlyDigits(v).length === 8, 'CEP deve ter 8 dígitos'),
    logradouro: z.string().trim().min(3, 'Rua obrigatória'),
    numero: z.string().trim().min(1, 'Número obrigatório'),
    complemento: z.string().trim().optional(),
    bairro: z.string().trim().min(2, 'Bairro obrigatório'),
    cidade: z.string().trim().min(2, 'Cidade obrigatória'),
    estado: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, 'UF inválida'),
})

type FormData = z.infer<typeof schema>

interface EmployeeFormProps {
    initialData?: Funcionario
    /** URL (assinada) para exibir a foto atual ao editar. */
    initialPhotoSrc?: string | null
}

function photoExtension(file: File) {
    const subtype = file.type.split('/')[1]
    if (!subtype) return 'jpg'
    return subtype === 'jpeg' ? 'jpg' : subtype
}

export default function EmployeeForm({ initialData, initialPhotoSrc }: EmployeeFormProps) {
    const [photo, setPhoto] = useState<File | null>(null)
    const [photoRemoved, setPhotoRemoved] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [loadingCep, setLoadingCep] = useState(false)
    const [cepMessage, setCepMessage] = useState<string | null>(null)
    const [errorHeader, setErrorHeader] = useState<string | null>(null)
    const lastCepLookup = useRef<string | null>(null)

    const router = useRouter()
    const supabase = createClient()

    // Default values if editing
    const defaultValues: Partial<FormData> = initialData ? {
        nome_completo: initialData.nome_completo,
        apelido: initialData.apelido || '',
        nome_mae: initialData.nome_mae || initialData.filiacao || '',
        nome_pai: initialData.nome_pai || '',
        cpf: formatCpf(initialData.cpf),
        rg: initialData.rg || '',
        cep: formatCep(initialData.cep),
        logradouro: initialData.logradouro || '',
        numero: initialData.numero || '',
        complemento: initialData.complemento || '',
        bairro: initialData.bairro || '',
        cidade: initialData.cidade || '',
        estado: initialData.estado || '',
    } : {}

    const { register, handleSubmit, formState: { errors }, setValue, setFocus } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues
    })

    const handlePhotoSelected = (file: File | null) => {
        setPhoto(file)
        setPhotoRemoved(file === null)
    }

    const lookupCep = async (cep: string) => {
        if (cep.length !== 8 || cep === lastCepLookup.current) return
        lastCepLookup.current = cep

        setLoadingCep(true)
        setCepMessage(null)
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
            if (!response.ok) throw new Error(`ViaCEP respondeu ${response.status}`)
            const data = await response.json()

            if (data.erro) {
                setCepMessage('CEP não encontrado. Preencha o endereço manualmente.')
                return
            }

            const options = { shouldValidate: true, shouldDirty: true }
            if (data.logradouro) setValue('logradouro', data.logradouro, options)
            if (data.bairro) setValue('bairro', data.bairro, options)
            setValue('cidade', data.localidade, options)
            setValue('estado', data.uf, options)
            setFocus(data.logradouro ? 'numero' : 'logradouro')
        } catch (error) {
            console.error('Erro ao buscar CEP', error)
            lastCepLookup.current = null
            setCepMessage('Não foi possível consultar o CEP. Preencha o endereço manualmente.')
        } finally {
            setLoadingCep(false)
        }
    }

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true)
        setErrorHeader(null)

        const previousFoto = initialData?.foto_url ?? null
        let foto_url = photoRemoved ? null : previousFoto
        let uploadedPath: string | null = null

        try {
            if (photo) {
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${photoExtension(photo)}`
                const { error: uploadError } = await supabase.storage
                    .from(PHOTO_BUCKET)
                    .upload(fileName, photo, { contentType: photo.type || 'image/jpeg' })

                if (uploadError) throw uploadError

                // O bucket é privado: guardamos o caminho e geramos URLs assinadas na leitura
                uploadedPath = fileName
                foto_url = fileName
            }

            const row = {
                ...data,
                apelido: data.apelido || null,
                nome_pai: data.nome_pai || null,
                rg: data.rg || null,
                complemento: data.complemento || null,
                cpf: formatCpf(data.cpf),
                cep: formatCep(data.cep),
                foto_url,
            }

            if (initialData?.id) {
                const { error: updateError } = await supabase
                    .from('funcionarios')
                    .update(row)
                    .eq('id', initialData.id)

                if (updateError) throw updateError
            } else {
                const { error: insertError } = await supabase
                    .from('funcionarios')
                    .insert(row)

                if (insertError) throw insertError
            }

            if (previousFoto && previousFoto !== foto_url) {
                await removePhoto(supabase, previousFoto)
            }

            router.push(initialData?.id ? `/funcionarios/${initialData.id}` : '/')
            router.refresh()
        } catch (err) {
            console.error(err)
            if (uploadedPath) await removePhoto(supabase, uploadedPath)

            const { code, message } = err as { code?: string; message?: string }
            setErrorHeader(code === '23505' ? 'Este CPF já está cadastrado.' : message || 'Erro ao salvar')
            window.scrollTo({ top: 0, behavior: 'smooth' })
            setIsSubmitting(false)
        }
    }

    return (
        <>
            {errorHeader && (
                <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm mb-6">
                    {errorHeader}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>

                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Dados Pessoais</h2>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <div className="flex justify-center mb-6">
                            <CameraInput onImageSelected={handlePhotoSelected} initialPreview={initialPhotoSrc || undefined} />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <Field id="nome_completo" label="Nome Completo *" error={errors.nome_completo?.message}>
                                <input
                                    id="nome_completo"
                                    {...register('nome_completo')}
                                    className="input"
                                    placeholder="Nome Completo"
                                    autoComplete="off"
                                    aria-invalid={!!errors.nome_completo}
                                />
                            </Field>
                            <Field id="apelido" label="Apelido">
                                <input id="apelido" {...register('apelido')} className="input" placeholder="Como é conhecido" autoComplete="off" />
                            </Field>
                            <Field id="cpf" label="CPF *" error={errors.cpf?.message}>
                                <input
                                    id="cpf"
                                    {...register('cpf', {
                                        onChange: (e) => setValue('cpf', formatCpf(e.target.value)),
                                    })}
                                    className="input font-mono"
                                    placeholder="000.000.000-00"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    maxLength={14}
                                    aria-invalid={!!errors.cpf}
                                />
                            </Field>
                            <Field id="rg" label="RG">
                                <input id="rg" {...register('rg')} className="input font-mono" autoComplete="off" />
                            </Field>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Filiação</h2>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <Field id="nome_mae" label="Nome da Mãe *" error={errors.nome_mae?.message}>
                            <input id="nome_mae" {...register('nome_mae')} className="input" autoComplete="off" aria-invalid={!!errors.nome_mae} />
                        </Field>
                        <Field id="nome_pai" label="Nome do Pai">
                            <input id="nome_pai" {...register('nome_pai')} className="input" autoComplete="off" />
                        </Field>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Endereço</h2>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <div className="grid grid-cols-12 gap-4">
                            <Field id="cep" label="CEP *" error={errors.cep?.message} className="col-span-12 sm:col-span-5">
                                <div className="relative">
                                    <input
                                        id="cep"
                                        {...register('cep', {
                                            onChange: (e) => {
                                                const formatted = formatCep(e.target.value)
                                                setValue('cep', formatted)
                                                lookupCep(onlyDigits(formatted))
                                            },
                                        })}
                                        className="input font-mono"
                                        placeholder="00000-000"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        maxLength={9}
                                        aria-invalid={!!errors.cep}
                                    />
                                    {loadingCep && <div className="absolute right-3 top-3.5"><Loader2 className="h-5 w-5 animate-spin text-blue-500" /></div>}
                                </div>
                                {cepMessage && <span className="text-amber-600 text-xs mt-1 block">{cepMessage}</span>}
                            </Field>
                            <Field id="cidade" label="Cidade *" error={errors.cidade?.message} className="col-span-9 sm:col-span-5">
                                <input id="cidade" {...register('cidade')} className="input" autoComplete="off" aria-invalid={!!errors.cidade} />
                            </Field>
                            <Field id="estado" label="UF *" error={errors.estado?.message} className="col-span-3 sm:col-span-2">
                                <input
                                    id="estado"
                                    {...register('estado')}
                                    className="input uppercase"
                                    autoComplete="off"
                                    maxLength={2}
                                    aria-invalid={!!errors.estado}
                                />
                            </Field>
                        </div>

                        <div className="grid grid-cols-12 gap-4">
                            <Field id="logradouro" label="Rua / Logradouro *" error={errors.logradouro?.message} className="col-span-12 sm:col-span-9">
                                <input id="logradouro" {...register('logradouro')} className="input" autoComplete="off" aria-invalid={!!errors.logradouro} />
                            </Field>
                            <Field id="numero" label="Número *" error={errors.numero?.message} className="col-span-4 sm:col-span-3">
                                <input id="numero" {...register('numero')} className="input" autoComplete="off" aria-invalid={!!errors.numero} />
                            </Field>
                            <Field id="bairro" label="Bairro *" error={errors.bairro?.message} className="col-span-8 sm:col-span-12">
                                <input id="bairro" {...register('bairro')} className="input" autoComplete="off" aria-invalid={!!errors.bairro} />
                            </Field>
                        </div>

                        <Field id="complemento" label="Complemento">
                            <input id="complemento" {...register('complemento')} className="input" autoComplete="off" />
                        </Field>
                    </div>
                </section>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sticky bottom-6 flex justify-center items-center gap-2 py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 active:scale-[0.98] transition-all disabled:opacity-70"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" aria-label="Salvando" /> : <><Save className="h-5 w-5" /> Salvar</>}
                </button>
            </form>
        </>
    )
}

function Field({ id, label, error, className, children }: {
    id: string
    label: string
    error?: string
    className?: string
    children: React.ReactNode
}) {
    return (
        <div className={className}>
            <label htmlFor={id} className="label">{label}</label>
            {children}
            {error && <span className="error">{error}</span>}
        </div>
    )
}
