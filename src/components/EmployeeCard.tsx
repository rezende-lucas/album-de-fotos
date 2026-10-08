import Image from 'next/image'
import Link from 'next/link'
import { FuncionarioListItem } from '@/types'
import { User, MapPin } from 'lucide-react'

interface EmployeeCardProps {
    funcionario: FuncionarioListItem
}

function formatShortAddress(f: FuncionarioListItem) {
    const cityUf = [f.cidade, f.estado].filter(Boolean).join('/')
    const parts = [f.bairro, cityUf].filter(Boolean)
    return parts.length > 0 ? parts.join(' – ') : f.endereco
}

export default function EmployeeCard({ funcionario }: EmployeeCardProps) {
    const address = formatShortAddress(funcionario)

    return (
        <Link href={`/funcionarios/${funcionario.id}`} className="block">
            <div className="bg-surface rounded-xl shadow-sm border border-line overflow-hidden active:scale-[0.98] transition-transform duration-200">
                <div className="flex p-4 gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0 rounded-full overflow-hidden bg-surface-muted border-2 border-surface shadow-sm">
                        {funcionario.foto_src ? (
                            <Image
                                src={funcionario.foto_src}
                                alt={funcionario.nome_completo}
                                fill
                                className="object-cover"
                                sizes="80px"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-fg-subtle">
                                <User className="h-10 w-10" />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col justify-center min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-fg truncate">
                            {funcionario.apelido || funcionario.nome_completo.split(' ')[0]}
                        </h3>
                        <p className="text-sm text-fg-muted truncate">
                            {funcionario.nome_completo}
                        </p>
                        {address && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-fg-subtle">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{address}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}
