import type { ElementType } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
    icon: ElementType;
    label: string;
    value: string | number;
    sub?: string;
    trend?: number | null;
    scrollTo?: string;
}

function highlightTarget(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('ring-2', 'ring-[#0969da]', 'ring-offset-2');
    setTimeout(() => {
        el.classList.remove('ring-2', 'ring-[#0969da]', 'ring-offset-2');
    }, 1500);
}

export function KpiCard({ icon: Icon, label, value, sub, trend, scrollTo }: KpiCardProps) {
    const isClickable = !!scrollTo;

    return (
        <div
            onClick={isClickable ? () => highlightTarget(scrollTo!) : undefined}
            className={`bg-white rounded-md border border-[#d0d7de] px-3 py-2.5 flex items-center gap-2.5 transition-all ${isClickable
                    ? 'cursor-pointer hover:border-[#0969da] hover:bg-[#f6f8fa] active:scale-[0.98]'
                    : ''
                }`}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={isClickable ? (e) => { if (e.key === 'Enter') highlightTarget(scrollTo!); } : undefined}
        >
            <Icon className="w-3.5 h-3.5 text-[#57606a] flex-shrink-0" strokeWidth={1.5} />
            <div className="min-w-0 flex-1">
                <p className="text-[10px] text-[#57606a] uppercase tracking-wider font-medium leading-none mb-0.5">
                    {label}
                </p>
                <div className="flex items-baseline gap-1.5">
                    <p className="text-lg font-semibold text-[#24292f] leading-none font-mono tabular-nums">
                        {value}
                    </p>
                    {trend != null && (
                        <span
                            className={`inline-flex items-center gap-0.5 text-[9px] font-mono ${trend >= 0 ? 'text-[#1a7f37]' : 'text-[#cf222e]'
                                }`}
                        >
                            {trend >= 0 ? (
                                <TrendingUp className="w-2.5 h-2.5" strokeWidth={1.5} />
                            ) : (
                                <TrendingDown className="w-2.5 h-2.5" strokeWidth={1.5} />
                            )}
                            {trend >= 0 ? '+' : ''}
                            {trend.toFixed(1)}%
                        </span>
                    )}
                </div>
                {sub && <p className="text-[9px] text-[#6e7781] truncate leading-none mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}
