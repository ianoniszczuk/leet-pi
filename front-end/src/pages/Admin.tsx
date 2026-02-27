import { useState } from 'react';
import { Users, BookOpen } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import GuidesTab from '@/components/admin/GuidesTab';
import UsersTab from '@/components/admin/UsersTab';

type Tab = 'users' | 'guides';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const { user: currentUser } = useAdmin();

  const currentUserRoles: string[] = currentUser?.roles ?? [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona usuarios y configuración del sistema</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'users'
                ? 'bg-white border border-b-white border-gray-200 text-primary-700 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <Users className="w-4 h-4" />
            Usuarios
          </button>
          <button
            onClick={() => setActiveTab('guides')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'guides'
                ? 'bg-white border border-b-white border-gray-200 text-primary-700 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <BookOpen className="w-4 h-4" />
            Guías &amp; Ejercicios
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'guides' && <GuidesTab />}
        {activeTab === 'users' && <UsersTab currentUserRoles={currentUserRoles} />}
      </div>
    </div>
  );
}
