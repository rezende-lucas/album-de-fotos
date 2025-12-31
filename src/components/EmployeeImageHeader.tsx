'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, User, X, Maximize2 } from 'lucide-react'

interface EmployeeImageHeaderProps {
    fotoUrl: string | null
    nomeCompleto: string
    apelido: string | null
}

export default function EmployeeImageHeader({ fotoUrl, nomeCompleto, apelido }: EmployeeImageHeaderProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <div className="relative h-64 bg-gray-900 group">
                {fotoUrl ? (
                    <div
                        onClick={() => setIsOpen(true)}
                        className="relative h-full w-full cursor-pointer"
                    >
                        <Image
                            src={fotoUrl}
                            alt={nomeCompleto}
                            fill
                            priority
                            className="object-cover opacity-90 transition-opacity hover:opacity-100"
                        />
                        {/* Visual indicator for click */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/30 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                            <Maximize2 className="h-6 w-6 text-white" />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-white/20">
                        <User className="h-32 w-32" />
                    </div>
                )}

                <Link
                    href="/"
                    className="absolute top-4 left-4 p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-colors z-10"
                >
                    <ArrowLeft className="h-6 w-6" />
                </Link>

                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-gray-900 to-transparent h-32 pointer-events-none" />
                <div className="absolute bottom-6 left-6 text-white pointer-events-none">
                    <h1 className="text-3xl font-bold">{apelido || nomeCompleto.split(' ')[0]}</h1>
                    <p className="text-white/80 font-medium">{nomeCompleto}</p>
                </div>
            </div>

            {/* Full Screen Modal */}
            {isOpen && fotoUrl && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-4 right-4 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    <div className="relative w-full h-full max-w-4xl max-h-[80vh]">
                        <Image
                            src={fotoUrl}
                            alt={nomeCompleto}
                            fill
                            className="object-contain"
                            quality={100}
                        />
                    </div>
                </div>
            )}
        </>
    )
}
