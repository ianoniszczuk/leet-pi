import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Callback() {
  const navigate = useNavigate();
  const { error } = useAuth0();

  useEffect(() => {
    if (error) {
      console.error('Auth0 Error:', error);
      navigate('/');
      return;
    }

    // Auth0 maneja automáticamente el callback
    // Redirigir a la página principal después de un breve delay
    const timer = setTimeout(() => {
      navigate('/');
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate, error]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Error de Autenticación
          </h2>
          <p className="text-gray-600 mb-4">
            Hubo un problema al iniciar sesión. Por favor, inténtalo de nuevo.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <LoadingSpinner size="lg" className="mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Iniciando Sesión...
        </h2>
        <p className="text-gray-600">
          Por favor espera mientras configuramos tu sesión.
        </p>
      </div>
    </div>
  );
}
