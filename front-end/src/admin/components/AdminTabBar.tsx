import { Users, BookOpen, BarChart2, Settings, FlaskConical } from 'lucide-react';

type Tab = 'users' | 'guides' | 'activity' | 'settings' | 'tests';

interface TabConfig {
    id: Tab;
    label: string;
    icon: React.ElementType;
}

const TABS: TabConfig[] = [
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'guides', label: 'Guías & Ejercicios', icon: BookOpen },
    { id: 'activity', label: 'Actividad', icon: BarChart2 },
    { id: 'settings', label: 'Configuración', icon: Settings },
    { id: 'tests', label: 'Pruebas', icon: FlaskConical },
];

interface AdminTabBarProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

export default function AdminTabBar({ activeTab, onTabChange }: AdminTabBarProps) {
    return (
        <div className="flex gap-1 mb-6 border-b border-gray-200">
            {TABS.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    onClick={() => onTabChange(id)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === id
                        ? 'bg-white border border-b-white border-gray-200 text-primary-700 -mb-px'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Icon className="w-4 h-4" />
                    {label}
                </button>
            ))}
        </div>
    );
}
