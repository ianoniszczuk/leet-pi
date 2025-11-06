import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface AdminRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function AdminRoute({ 
  children, 
  fallback = <AccessDenied /> 
}: AdminRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  if (!isAdmin) {
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

function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600">
            No tienes permisos de administrador para acceder a esta página.
          </p>
        </div>
        
        <button
          onClick={() => navigate('/submit')}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Volver al Editor
        </button>
      </div>
    </div>
  );
}

