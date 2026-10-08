'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, RefreshCw, Trash2 } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import Image from 'next/image'

interface CameraInputProps {
    /** Recebe o arquivo comprimido, ou `null` quando a foto é removida. */
    onImageSelected: (file: File | null) => void
    initialPreview?: string
}

export default function CameraInput({ onImageSelected, initialPreview }: CameraInputProps) {
    const [preview, setPreview] = useState<string | null>(initialPreview || null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const objectUrlRef = useRef<string | null>(null)

    const setObjectUrl = (url: string | null) => {
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = url
    }

    useEffect(() => () => setObjectUrl(null), [])

    const openPicker = () => fileInputRef.current?.click()

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setLoading(true)
        setError(null)
        try {
            const compressedFile = await imageCompression(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1080,
                useWebWorker: true,
            })

            const url = URL.createObjectURL(compressedFile)
            setObjectUrl(url)
            setPreview(url)
            onImageSelected(compressedFile)
        } catch (err) {
            console.error('Error compressing image:', err)
            setError('Não foi possível processar a imagem. Tente outra foto.')
        } finally {
            setLoading(false)
            // Permite selecionar o mesmo arquivo novamente
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const clearImage = () => {
        setObjectUrl(null)
        setPreview(null)
        setError(null)
        onImageSelected(null)
    }

    return (
        <div className="space-y-2 w-full">
            <div
                role={preview ? undefined : 'button'}
                tabIndex={preview ? undefined : 0}
                aria-label={preview ? undefined : 'Tirar foto ou escolher imagem'}
                onClick={() => !preview && openPicker()}
                onKeyDown={(e) => {
                    if (!preview && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault()
                        openPicker()
                    }
                }}
                className={`
          relative w-full aspect-square max-w-sm mx-auto rounded-2xl border-2 border-dashed
          flex flex-col items-center justify-center transition-colors overflow-hidden
          ${preview ? 'border-blue-500 bg-black' : 'cursor-pointer border-gray-300 bg-gray-50 hover:bg-gray-100'}
        `}
            >
                {preview ? (
                    <>
                        <Image
                            src={preview}
                            alt="Pré-visualização da foto"
                            fill
                            sizes="384px"
                            className="object-contain"
                        />
                        {loading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <RefreshCw className="h-8 w-8 text-white animate-spin" />
                            </div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-2">
                            <button
                                type="button"
                                onClick={openPicker}
                                disabled={loading}
                                aria-label="Trocar foto"
                                title="Trocar foto"
                                className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm"
                            >
                                <RefreshCw className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={clearImage}
                                disabled={loading}
                                aria-label="Remover foto"
                                title="Remover foto"
                                className="p-2 bg-red-500/80 text-white rounded-full hover:bg-red-600 backdrop-blur-sm"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center p-6">
                        <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                            {loading ? (
                                <RefreshCw className="h-8 w-8 animate-spin" />
                            ) : (
                                <Camera className="h-8 w-8" />
                            )}
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                            {loading ? 'Processando...' : 'Tirar Foto / Upload'}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                            Toque para abrir a câmera
                        </p>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>
            {error && <p role="alert" className="error text-center">{error}</p>}
        </div>
    )
}
