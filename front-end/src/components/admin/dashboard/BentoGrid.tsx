import type { ReactNode } from 'react';

interface BentoGridProps {
    /** Main chart area (70%) */
    main: ReactNode;
    /** Side chart area (30%) */
    side: ReactNode;
}

export function BentoGrid({ main, side }: BentoGridProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-3">
            {main}
            {side}
        </div>
    );
}
