import { Loader2 } from 'lucide-react';

type SkeletonVariant = 'kpi' | 'line' | 'bar' | 'calendar' | 'table';

function Pulse({ className, style }: { className: string; style?: React.CSSProperties }) {
    return <div className={`animate-pulse bg-[#f0f2f5] rounded ${className}`} style={style} />;
}

export function SkeletonLoader({ variant = 'line' }: { variant?: SkeletonVariant }) {
    if (variant === 'kpi') {
        return (
            <div className="bg-white rounded-md border border-[#d0d7de] px-3 py-2.5 flex items-center gap-2.5">
                <Pulse className="w-3.5 h-3.5 rounded-full flex-shrink-0" />
                <div className="flex-1">
                    <Pulse className="h-2 w-14 mb-1" />
                    <Pulse className="h-5 w-10" />
                </div>
            </div>
        );
    }

    if (variant === 'calendar') {
        return (
            <div className="bg-white rounded-md border border-[#d0d7de] p-4">
                <Pulse className="h-3 w-48 mb-4" />
                <div className="flex gap-1 flex-wrap">
                    {Array.from({ length: 52 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-1">
                            {Array.from({ length: 7 }).map((_, j) => (
                                <Pulse key={j} className="w-[10px] h-[10px] rounded-sm" />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (variant === 'table') {
        return (
            <div className="bg-white rounded-md border border-[#d0d7de] p-4">
                <Pulse className="h-3 w-48 mb-4" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                        <Pulse className="h-3 w-3 rounded-full" />
                        <Pulse className="h-3 w-32" />
                        <div className="flex-1" />
                        <Pulse className="h-3 w-16" />
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'bar') {
        return (
            <div className="bg-white rounded-md border border-[#d0d7de] p-4">
                <Pulse className="h-3 w-40 mb-4" />
                <div className="flex items-end gap-2 h-[160px]">
                    {[60, 40, 80, 55, 70].map((h, i) => (
                        <Pulse key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
                    ))}
                </div>
            </div>
        );
    }

    // line chart skeleton
    return (
        <div className="bg-white rounded-md border border-[#d0d7de] p-4">
            <Pulse className="h-3 w-56 mb-4" />
            <div className="h-[180px] flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-[#6e7781]" />
            </div>
        </div>
    );
}
