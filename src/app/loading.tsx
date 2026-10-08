export default function Loading() {
    return (
        <div className="min-h-screen bg-page animate-pulse max-w-6xl mx-auto" aria-busy="true" aria-label="Carregando">
            <div className="px-4 py-6 space-y-2">
                <div className="h-7 w-40 bg-line-strong rounded-lg" />
                <div className="h-4 w-24 bg-line-strong rounded" />
            </div>
            <div className="px-4 pt-4 pb-2">
                <div className="h-12 bg-line-strong rounded-xl" />
            </div>
            <div className="px-4 mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-surface rounded-xl border border-line">
                        <div className="h-20 w-20 rounded-full bg-line-strong flex-shrink-0" />
                        <div className="flex-1 space-y-2 py-3">
                            <div className="h-5 w-1/2 bg-line-strong rounded" />
                            <div className="h-4 w-3/4 bg-line-strong rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
