import type { ReactNode } from 'react';

interface MetricGridProps {
    children: ReactNode;
}

export function MetricGrid({ children }: MetricGridProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {children}
        </div>
    );
}
