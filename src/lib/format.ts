export function onlyDigits(value: string | null | undefined): string {
    return (value ?? '').replace(/\D/g, '')
}

export function formatCpf(value: string | null | undefined): string {
    const digits = onlyDigits(value).slice(0, 11)
    return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function formatCep(value: string | null | undefined): string {
    const digits = onlyDigits(value).slice(0, 8)
    return digits.replace(/(\d{5})(\d)/, '$1-$2')
}

/** Valida os dígitos verificadores do CPF. */
export function isValidCpf(value: string | null | undefined): boolean {
    const cpf = onlyDigits(value)
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

    const checkDigit = (length: number) => {
        let sum = 0
        for (let i = 0; i < length; i++) {
            sum += Number(cpf[i]) * (length + 1 - i)
        }
        const rest = (sum * 10) % 11
        return rest === 10 ? 0 : rest
    }

    return checkDigit(9) === Number(cpf[9]) && checkDigit(10) === Number(cpf[10])
}

/** Minúsculas e sem acentos, para buscas ("joao" encontra "João"). */
export function normalizeText(value: string | null | undefined): string {
    return (value ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
}

export function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

export function formatDateTime(value: string): string {
    return new Date(value).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}
