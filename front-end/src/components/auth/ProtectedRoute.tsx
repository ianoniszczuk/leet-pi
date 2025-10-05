import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  fallback = <LoginPrompt /> 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

function LoginPrompt() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso Requerido
          </h2>
          <p className="text-gray-600">
            Necesitas iniciar sesión para acceder a esta página.
          </p>
        </div>
        
        <button
          onClick={login}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Iniciar Sesión
        </button>
        
        <p className="text-sm text-gray-500 mt-4">
          Usa tu cuenta de Auth0 para acceder al sistema
        </p>
      </div>
    </div>
  );
}
