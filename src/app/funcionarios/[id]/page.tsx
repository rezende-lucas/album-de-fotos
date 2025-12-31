import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, User, MapPin, FileText, Calendar } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import EmployeeImageHeader from '@/components/EmployeeImageHeader'
import EmployeeActions from '@/components/EmployeeActions'

export default async function EmployeeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: funcionario, error } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !funcionario) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-safe">
            {/* Header Image */}
            <EmployeeImageHeader
                fotoUrl={funcionario.foto_url}
                nomeCompleto={funcionario.nome_completo}
                apelido={funcionario.apelido}
            />

            <main className="p-4 -mt-4 relative z-10 space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">

                    <Section icon={<FileText className="h-5 w-5 text-blue-500" />} title="Documentos">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-gray-500 uppercase font-semibold">CPF</span>
                                <p className="font-mono text-gray-900">{funcionario.cpf}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 uppercase font-semibold">RG</span>
                                <p className="font-mono text-gray-900">{funcionario.rg || '-'}</p>
                            </div>
                        </div>
                    </Section>

                    <hr className="border-gray-100" />

                    <Section icon={<MapPin className="h-5 w-5 text-red-500" />} title="Endereço">
                        {funcionario.logradouro ? (
                            <div className="text-gray-700">
                                <p className="font-medium">{funcionario.logradouro}, {funcionario.numero}</p>
                                {funcionario.complemento && <p className="text-sm text-gray-500">{funcionario.complemento}</p>}
                                <p>{funcionario.bairro} - {funcionario.cidade}/{funcionario.estado}</p>
                                <p className="text-sm text-gray-400 mt-1">{funcionario.cep}</p>
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">Endereço não informado (ou formato antigo)</p>
                        )}
                    </Section>

                    <hr className="border-gray-100" />

                    <Section icon={<User className="h-5 w-5 text-purple-500" />} title="Filiação">
                        <div className="space-y-3">
                            <div>
                                <span className="text-xs text-gray-500 uppercase font-semibold">Mãe</span>
                                <p className="text-gray-900">{funcionario.nome_mae || funcionario.filiacao || 'Não informado'}</p>
                            </div>

                            {funcionario.nome_pai && (
                                <div>
                                    <span className="text-xs text-gray-500 uppercase font-semibold">Pai</span>
                                    <p className="text-gray-900">{funcionario.nome_pai}</p>
                                </div>
                            )}
                        </div>
                    </Section>


                    <hr className="border-gray-100" />

                    <EmployeeActions id={funcionario.id} />

                    <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 justify-center">
                        <Calendar className="h-4 w-4" />
                        <span>Cadastrado em {new Date(funcionario.created_at).toLocaleDateString()}</span>
                    </div>

                </div>
            </main>
        </div>
    )
}

function Section({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                {icon}
                <h3 className="font-semibold text-gray-900">{title}</h3>
            </div>
            <div>{children}</div>
        </div>
    )
}
