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

const RELATIVO = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

/** "hoje", "ontem", "há 3 dias", "há 2 meses"… */
export function formatRelativeDate(value: string, agora: Date = new Date()): string {
    const fuso = 'America/Sao_Paulo'
    const dia = (d: Date) => new Date(d.toLocaleDateString('en-CA', { timeZone: fuso }))
    const dias = Math.round((dia(new Date(value)).getTime() - dia(agora).getTime()) / 86_400_000)
    if (dias > -30) return RELATIVO.format(dias, 'day')
    if (dias > -365) return RELATIVO.format(Math.round(dias / 30), 'month')
    return RELATIVO.format(Math.round(dias / 365), 'year')
}

/** Valor para <input type="datetime-local"> no fuso de Brasília. */
export function toDateTimeLocal(value: string | Date): string {
    const partes = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    }).format(new Date(value))
    return partes.replace(' ', 'T')
}

/** Converte o valor de <input type="datetime-local"> (horário de Brasília) para ISO. */
export function fromDateTimeLocal(value: string): string {
    return new Date(`${value}:00-03:00`).toISOString()
}
