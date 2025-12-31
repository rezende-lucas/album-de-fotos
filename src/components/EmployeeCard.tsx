import Image from 'next/image'
import Link from 'next/link'
import { Funcionario } from '@/types'
import { User, MapPin } from 'lucide-react'

interface EmployeeCardProps {
    funcionario: Funcionario
}

export default function EmployeeCard({ funcionario }: EmployeeCardProps) {
    return (
        <Link href={`/funcionarios/${funcionario.id}`} className="block">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform duration-200">
                <div className="flex p-4 gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm">
                        {funcionario.foto_url ? (
                            <Image
                                src={funcionario.foto_url}
                                alt={funcionario.nome_completo}
                                fill
                                className="object-cover"
                                sizes="80px"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                                <User className="h-10 w-10" />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col justify-center min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                            {funcionario.apelido || funcionario.nome_completo.split(' ')[0]}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                            {funcionario.nome_completo}
                        </p>
                        {funcionario.endereco && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{funcionario.endereco}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}
