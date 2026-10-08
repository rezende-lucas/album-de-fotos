export default function Loading() {
    return (
        <div className="min-h-screen bg-page animate-pulse lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-6 lg:items-start lg:max-w-6xl lg:mx-auto lg:p-6" aria-busy="true" aria-label="Carregando">
            <div className="h-64 sm:h-80 lg:h-[32rem] lg:rounded-2xl bg-line-strong" />
            <div className="p-4 -mt-4 relative lg:p-0 lg:mt-0">
                <div className="bg-surface rounded-2xl border border-line p-6 space-y-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-3">
                            <div className="h-5 w-32 bg-line-strong rounded" />
                            <div className="h-4 w-3/4 bg-line-strong rounded" />
                            <div className="h-4 w-1/2 bg-line-strong rounded" />
                        </div>
                    ))}
                    <div className="flex gap-4">
                        <div className="flex-1 h-12 bg-line-strong rounded-xl" />
                        <div className="flex-1 h-12 bg-line-strong rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    )
}
