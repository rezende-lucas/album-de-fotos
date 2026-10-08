import LoginForm from '@/components/LoginForm'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ erro?: string }>
}) {
    const { erro } = await searchParams
    const initialError = erro === 'auth' ? 'Link de acesso inválido ou expirado. Entre novamente.' : null

    return <LoginForm initialError={initialError} />
}
