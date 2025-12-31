'use client'

import { useState, useRef } from 'react'
import { Camera, RefreshCw, Trash2 } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import Image from 'next/image'

interface CameraInputProps {
    onImageSelected: (file: File) => void
    initialPreview?: string
}

export default function CameraInput({ onImageSelected, initialPreview }: CameraInputProps) {
    const [preview, setPreview] = useState<string | null>(initialPreview || null)
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setLoading(true)
        try {
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1080,
                useWebWorker: true,
            }

            const compressedFile = await imageCompression(file, options)

            // Update preview
            const reader = new FileReader()
            reader.readAsDataURL(compressedFile)
            reader.onloadend = () => {
                setPreview(reader.result as string)
            }

            onImageSelected(compressedFile)
        } catch (error) {
            console.error("Error compressing image:", error)
        } finally {
            setLoading(false)
        }
    }

    const clearImage = () => {
        setPreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <div className="space-y-4">
            <div
                onClick={() => !preview && fileInputRef.current?.click()}
                className={`
          relative w-full aspect-square max-w-sm mx-auto rounded-2xl border-2 border-dashed
          flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden
          ${preview ? 'border-blue-500 bg-black' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}
        `}
            >
                {preview ? (
                    <>
                        <Image
                            src={preview}
                            alt="Preview"
                            fill
                            className="object-contain"
                        />
                        {/* Overlays */}
                        <div className="absolute top-2 right-2 flex gap-2">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    fileInputRef.current?.click()
                                }}
                                className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm"
                            >
                                <RefreshCw className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    clearImage()
                                }}
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
        </div>
    )
}
