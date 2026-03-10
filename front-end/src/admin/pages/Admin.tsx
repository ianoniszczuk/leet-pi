import { useState } from 'react';
import { useAdmin } from '@/admin/hooks/useAdmin';
import AdminTabBar from '@/admin/components/AdminTabBar';
import GuidesTab from '@/admin/components/GuidesTab';
import UsersTab from '@/admin/components/UsersTab';
import ActivityTab from '@/admin/components/ActivityTab';
import SettingsTab from '@/admin/components/SettingsTab';
import PageHeader from '@/shared/components/PageHeader';

type Tab = 'users' | 'guides' | 'activity' | 'settings';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const { user: currentUser } = useAdmin();

  const currentUserRoles: string[] = currentUser?.roles ?? [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Panel de Administración"
          subtitle="Gestiona usuarios y configuración del sistema"
        />

        <AdminTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'guides' && <GuidesTab />}
        {activeTab === 'users' && <UsersTab currentUserRoles={currentUserRoles} />}
        {activeTab === 'activity' && <ActivityTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}
