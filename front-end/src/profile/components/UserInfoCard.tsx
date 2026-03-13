import { User, Mail, Calendar, Pencil } from 'lucide-react';
import type { Auth0User } from '@/auth/types';
import type { UserProfile } from '@/profile/types';

interface UserInfoCardProps {
    auth0User: Auth0User | null | undefined;
    userProfile: UserProfile | null | undefined;
    onEditClick: () => void;
}

export default function UserInfoCard({ auth0User, userProfile, onEditClick }: UserInfoCardProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    {auth0User?.picture ? (
                        <img src={auth0User.picture} alt="Avatar" className="w-16 h-16 rounded-full" />
                    ) : (
                        <User className="w-8 h-8 text-primary-600" />
                    )}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-gray-900">{userProfile?.fullName}</h2>
                        <button
                            onClick={onEditClick}
                            className="text-gray-400 hover:text-primary-600 transition-colors"
                            title="Editar perfil"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-gray-600">{userProfile?.email}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{userProfile?.email}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                        <p className="text-sm text-gray-600">Miembro desde</p>
                        <p className="font-medium text-gray-900">
                            {userProfile
                                ? new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
                                : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
