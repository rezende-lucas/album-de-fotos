export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-50 animate-pulse" aria-busy="true" aria-label="Carregando">
            <div className="px-4 py-6 space-y-2">
                <div className="h-7 w-40 bg-gray-200 rounded-lg" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
            <div className="px-4 pt-4 pb-2">
                <div className="h-12 bg-gray-200 rounded-xl" />
            </div>
            <div className="px-4 space-y-3 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100">
                        <div className="h-20 w-20 rounded-full bg-gray-200 flex-shrink-0" />
                        <div className="flex-1 space-y-2 py-3">
                            <div className="h-5 w-1/2 bg-gray-200 rounded" />
                            <div className="h-4 w-3/4 bg-gray-200 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
