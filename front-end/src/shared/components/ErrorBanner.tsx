import { AlertCircle } from 'lucide-react';

interface ErrorBannerProps {
    message: string;
    onDismiss?: () => void;
}

export default function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
    return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="flex-1 text-sm text-red-700">{message}</p>
            {onDismiss && (
                <button onClick={onDismiss} className="text-red-400 hover:text-red-600 text-xs">
                    ✕
                </button>
            )}
        </div>
    );
}
