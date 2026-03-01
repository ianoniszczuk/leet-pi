import { useAuth } from '@/hooks/useAuth';
import { LogIn, LogOut, User } from 'lucide-react';

interface AuthButtonProps {
  className?: string;
  variant?: 'default' | 'minimal';
}

export default function AuthButton({ 
  className = '', 
  variant = 'default' 
}: AuthButtonProps) {
  const { isAuthenticated, user, login, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-200 h-10 w-24 rounded-lg"></div>
    );
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={login}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${variant === 'minimal' 
            ? 'text-gray-700 hover:text-primary-600 hover:bg-gray-100' 
            : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl'
          }
          ${className}
        `}
        aria-label="Iniciar sesión con cuenta institucional"
      >
        <LogIn className="w-4 h-4" />
        Iniciar Sesión
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* User Info */}
      <div className="flex items-center gap-2 text-sm">
        {user?.picture ? (
          <img
            src={user.picture}
            alt="Avatar"
            className="w-8 h-8 rounded-full"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center ${user?.picture ? 'hidden' : ''}`}>
          <User className="w-4 h-4 text-primary-600" />
        </div>
        <span className="hidden md:block text-gray-700 font-medium">
          {user?.name || user?.email}
        </span>
      </div>

      {/* Logout Button */}
      <button
        onClick={logout}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-sm
          ${variant === 'minimal' 
            ? 'text-gray-600 hover:text-red-600 hover:bg-red-50' 
            : 'bg-red-600 hover:bg-red-700 text-white'
          }
        `}
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:block">Salir</span>
      </button>
    </div>
  );
}
