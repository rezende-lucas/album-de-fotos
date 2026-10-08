'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { BadgeCheck, Camera, CheckCircle2, IdCard, ImagePlus, Loader2, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCpf, isValidCpf } from '@/lib/format'
import { comprimirFoto } from '@/lib/photo-upload'

const schema = z.object({
    nome: z.string().trim().min(5, 'Informe o nome completo'),
    cpf: z.string().refine(isValidCpf, 'CPF inválido'),
    matricula: z.string().trim().min(2, 'Informe a matrícula').max(30, 'Matrícula muito longa'),
    email: z.string().trim().email('E-mail inválido'),
    senha: z.string().min(8, 'A senha deve ter ao menos 8 caracteres'),
    confirmacao: z.string(),
}).refine((d) => d.senha === d.confirmacao, { path: ['confirmacao'], message: 'As senhas não conferem' })

type FormData = z.infer<typeof schema>

const ERROS: [RegExp, string][] = [
    [/already registered|already been registered/i, 'Este e-mail já está cadastrado.'],
    [/database error saving new user/i, 'Este CPF já está cadastrado.'],
    [/signups? not allowed|signup is disabled/i, 'O cadastro de novos usuários está desativado. Fale com um administrador.'],
    [/password/i, 'Senha fraca: use ao menos 8 caracteres, misturando letras e números.'],
    [/rate limit|too many/i, 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'],
]

function traduzirErro(message?: string) {
    return ERROS.find(([re]) => re.test(message ?? ''))?.[1] ?? 'Não foi possível concluir o cadastro. Tente novamente.'
}

/** Cadastro de agente: nome, CPF, matrícula, foto da funcional, e-mail e senha. A conta fica pendente de aprovação. */
export default function CadastroForm() {
    const router = useRouter()
    const [funcional, setFuncional] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [processando, setProcessando] = useState(false)
    const [erroFoto, setErroFoto] = useState<string | null>(null)
    const [erro, setErro] = useState<string | null>(null)
    const [enviando, setEnviando] = useState(false)
    const [confirmarEmail, setConfirmarEmail] = useState<string | null>(null)
    const cameraRef = useRef<HTMLInputElement>(null)
    const galeriaRef = useRef<HTMLInputElement>(null)

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

    const escolherFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const original = e.target.files?.[0]
        e.target.value = ''
        if (!original) return
        setProcessando(true)
        setErroFoto(null)
        try {
            const arquivo = await comprimirFoto(original)
            setFuncional(arquivo)
            setPreview(URL.createObjectURL(arquivo))
            setErroFoto(null)
        } catch (err) {
            console.error(err)
            setErroFoto('Não foi possível processar a imagem. Tente outra foto.')
        } finally {
            setProcessando(false)
        }
    }

    const onSubmit = async (data: FormData) => {
        if (!funcional) {
            setErroFoto('Envie a foto da sua funcional.')
            return
        }
        setEnviando(true)
        setErro(null)
        const supabase = createClient()

        // 1) A funcional vai primeiro (a conta ainda não existe; o bucket só aceita a pasta "cadastro/")
        const caminho = `cadastro/${crypto.randomUUID()}.jpg`
        const { error: uploadError } = await supabase.storage
            .from('funcionais')
            .upload(caminho, funcional, { contentType: funcional.type || 'image/jpeg' })
        if (uploadError) {
            console.error(uploadError)
            setErro('Não foi possível enviar a foto da funcional. Verifique a conexão e tente de novo.')
            setEnviando(false)
            return
        }

        // 2) Cria a conta; o perfil (pendente) é criado no banco com estes dados
        const { data: res, error } = await supabase.auth.signUp({
            email: data.email.trim(),
            password: data.senha,
            options: {
                data: { nome: data.nome.trim(), cpf: formatCpf(data.cpf), matricula: data.matricula.trim(), funcional: caminho },
                emailRedirectTo: `${window.location.origin}/auth/callback?next=/aguardando`,
            },
        })

        // Com confirmação de e-mail ligada, e-mail repetido volta "sem identidades" em vez de erro
        if (error || (res.user && res.user.identities?.length === 0)) {
            console.error(error)
            setErro(error ? traduzirErro(error.message) : 'Este e-mail já está cadastrado.')
            setEnviando(false)
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }

        if (res.session) {
            router.push('/aguardando')
            router.refresh()
        } else {
            setConfirmarEmail(data.email.trim())
        }
    }

    if (confirmarEmail) {
        return (
            <Moldura>
                <div className="text-center space-y-4">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-fg">Cadastro enviado!</h2>
                    <p className="text-sm text-fg-muted">
                        Enviamos um link de confirmação para <strong className="text-fg">{confirmarEmail}</strong>.
                        Depois de confirmar o e-mail, um administrador vai conferir sua funcional e liberar o acesso.
                    </p>
                    <Link href="/login" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
                        Ir para o login
                    </Link>
                </div>
            </Moldura>
        )
    }

    return (
        <Moldura>
            <div className="text-center">
                <div className="mx-auto h-12 w-12 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center mb-4">
                    <BadgeCheck className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-fg">Cadastro</h2>
                <p className="mt-2 text-sm text-fg-muted">
                    Preencha seus dados. O acesso é liberado depois que um administrador conferir sua funcional.
                </p>
            </div>

            {erro && (
                <div role="alert" className="mt-6 bg-red-50 border border-red-200 text-red-600 dark:bg-red-950/50 dark:border-red-900 dark:text-red-300 text-sm p-3 rounded-lg">
                    {erro}
                </div>
            )}

            <form
                // Mostra o aviso da funcional junto com os outros erros do formulário
                onSubmit={handleSubmit(onSubmit, () => { if (!funcional) setErroFoto('Envie a foto da sua funcional.') })}
                className="mt-6 space-y-4"
                noValidate
            >
                <Campo id="nome" label="Nome completo *" erro={errors.nome?.message}>
                    <input id="nome" {...register('nome')} autoComplete="name" className="input" aria-invalid={!!errors.nome} />
                </Campo>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Campo id="cpf" label="CPF *" erro={errors.cpf?.message}>
                        <input
                            id="cpf"
                            {...register('cpf', { onChange: (e) => setValue('cpf', formatCpf(e.target.value)) })}
                            inputMode="numeric"
                            maxLength={14}
                            placeholder="000.000.000-00"
                            autoComplete="off"
                            className="input font-mono"
                            aria-invalid={!!errors.cpf}
                        />
                    </Campo>
                    <Campo id="matricula" label="Matrícula *" erro={errors.matricula?.message}>
                        <input id="matricula" {...register('matricula')} autoComplete="off" className="input font-mono" aria-invalid={!!errors.matricula} />
                    </Campo>
                </div>

                <div className="space-y-2">
                    <span className="label">Foto da funcional *</span>
                    {preview ? (
                        <div className="relative aspect-[3/2] rounded-xl overflow-hidden bg-black">
                            <Image src={preview} alt="Foto da funcional" fill sizes="400px" className="object-contain" />
                            <button
                                type="button"
                                onClick={() => cameraRef.current?.click()}
                                className="absolute top-2 right-2 flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/60 text-white text-sm backdrop-blur-sm"
                            >
                                <RefreshCw className="h-4 w-4" /> Trocar
                            </button>
                        </div>
                    ) : (
                        <div className={`rounded-xl border-2 border-dashed ${erroFoto ? 'border-red-400' : 'border-line-strong'} bg-surface-muted p-4 space-y-3`}>
                            <div className="flex items-center gap-3 text-fg-muted text-sm">
                                <IdCard className="h-8 w-8 flex-shrink-0 text-fg-subtle" />
                                Fotografe a frente da sua funcional, com os dados legíveis.
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    disabled={processando}
                                    onClick={() => cameraRef.current?.click()}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
                                >
                                    {processando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />} Câmera
                                </button>
                                <button
                                    type="button"
                                    disabled={processando}
                                    onClick={() => galeriaRef.current?.click()}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface border border-line-strong text-fg-soft font-semibold disabled:opacity-60"
                                >
                                    <ImagePlus className="h-5 w-5" /> Galeria
                                </button>
                            </div>
                        </div>
                    )}
                    {erroFoto && <span role="alert" className="error">{erroFoto}</span>}
                    <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={escolherFoto} className="hidden" aria-hidden="true" tabIndex={-1} />
                    <input ref={galeriaRef} type="file" accept="image/*" onChange={escolherFoto} className="hidden" aria-hidden="true" tabIndex={-1} />
                </div>

                <hr className="border-line" />

                <Campo id="email" label="E-mail *" erro={errors.email?.message}>
                    <input id="email" type="email" {...register('email')} autoComplete="email" className="input" aria-invalid={!!errors.email} />
                </Campo>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Campo id="senha" label="Senha *" erro={errors.senha?.message}>
                        <input id="senha" type="password" {...register('senha')} autoComplete="new-password" className="input" aria-invalid={!!errors.senha} />
                    </Campo>
                    <Campo id="confirmacao" label="Confirmar senha *" erro={errors.confirmacao?.message}>
                        <input id="confirmacao" type="password" {...register('confirmacao')} autoComplete="new-password" className="input" aria-invalid={!!errors.confirmacao} />
                    </Campo>
                </div>

                <button
                    type="submit"
                    disabled={enviando || processando}
                    className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70 transition-all"
                >
                    {enviando ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Enviando" /> : 'Solicitar acesso'}
                </button>

                <p className="text-center text-sm text-fg-muted">
                    Já tem acesso? <Link href="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Entrar</Link>
                </p>
            </form>
        </Moldura>
    )
}

function Moldura({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-page px-4 py-10">
            <div className="w-full max-w-lg bg-surface p-6 sm:p-8 rounded-2xl shadow-lg border border-line">{children}</div>
        </div>
    )
}

function Campo({ id, label, erro, children }: { id: string, label: string, erro?: string, children: React.ReactNode }) {
    return (
        <div>
            <label htmlFor={id} className="label">{label}</label>
            {children}
            {erro && <span className="error">{erro}</span>}
        </div>
    )
}
