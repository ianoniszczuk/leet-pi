import type { ReactNode, ElementType } from 'react';
import { BookOpen, Layers } from 'lucide-react';

export type SubView = 'curso' | 'progreso';

const SUB_VIEWS: { id: SubView; label: string; icon: ElementType }[] = [
    { id: 'curso', label: 'Curso', icon: BookOpen },
    { id: 'progreso', label: 'Progreso', icon: Layers },
];

interface DashboardHeaderProps {
    activeView: SubView;
    onViewChange: (view: SubView) => void;
    children?: ReactNode;
}

export function DashboardHeader({ activeView, onViewChange, children }: DashboardHeaderProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex rounded-md border border-[#d0d7de] overflow-hidden w-fit">
                {SUB_VIEWS.map(({ id, label, icon: Icon }, idx) => (
                    <button
                        key={id}
                        onClick={() => onViewChange(id)}
                        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors
              ${idx > 0 ? 'border-l border-[#d0d7de]' : ''}
              ${activeView === id
                                ? 'bg-[#24292f] text-white'
                                : 'bg-white text-[#57606a] hover:bg-[#f6f8fa]'
                            }`}
                    >
                        <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                        {label}
                    </button>
                ))}
            </div>
            {children && <div className="flex items-center gap-2">{children}</div>}
        </div>
    );
}
