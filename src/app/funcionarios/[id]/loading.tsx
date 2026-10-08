export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-50 animate-pulse" aria-busy="true" aria-label="Carregando">
            <div className="h-64 bg-gray-300" />
            <div className="p-4 -mt-4 relative">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-3">
                            <div className="h-5 w-32 bg-gray-200 rounded" />
                            <div className="h-4 w-3/4 bg-gray-200 rounded" />
                            <div className="h-4 w-1/2 bg-gray-200 rounded" />
                        </div>
                    ))}
                    <div className="flex gap-4">
                        <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
                        <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    )
}
