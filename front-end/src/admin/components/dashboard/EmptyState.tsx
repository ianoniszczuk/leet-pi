import { AlertCircle } from 'lucide-react';

export function EmptyState({ label }: { label: string }) {
    return (
        <div className="flex items-center justify-center h-40 text-sm text-[#6e7781]">
            {label}
        </div>
    );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="flex items-start gap-2 border border-[#cf222e]/30 bg-[#ffebe9] rounded-md p-3 text-sm">
            <AlertCircle className="w-4 h-4 text-[#cf222e] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
                <p className="text-[#82071e] font-medium">{message}</p>
                <button onClick={onRetry} className="text-[#cf222e] underline text-xs mt-1">
                    Reintentar
                </button>
            </div>
        </div>
    );
}
