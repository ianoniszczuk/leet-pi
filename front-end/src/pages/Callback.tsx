import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { API_CONFIG, API_ENDPOINTS } from '@/config/api';
import apiService from '@/services/api';

export default function Callback() {
  const navigate = useNavigate();
  const {
    error,
    isLoading,
    getAccessTokenSilently,
    logout,
  } = useAuth0();

  useEffect(() => {
    let cancelled = false;

    const redirectHome = (message?: string, forceLogout = false) => {
      apiService.clearAuthTokens();
      if (message) {
        sessionStorage.setItem('auth_error', message);
      } else {
        sessionStorage.removeItem('auth_error');
      }
      if (forceLogout) {
        logout({
          logoutParams: {
            returnTo: window.location.origin,
          },
          federated: true,
        });
        return;
      }
      if (!cancelled) {
        navigate('/', { replace: true });
      }
    };

    if (error) {
      console.error('Auth0 Error:', error);
      redirectHome(error.message, true);
      return () => {
        cancelled = true;
      };
    }

    if (isLoading) {
      return () => {
        cancelled = true;
      };
    }

    const handleToken = async () => {
      try {
        const auth0Token = await getAccessTokenSilently();

        const response = await fetch(
          `${API_CONFIG.baseURL}${API_ENDPOINTS.auth.login}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${auth0Token}`,
            },
          }
        );

        if (!response.ok) {
          let errorMessage = `API responded with status ${response.status}`;

          try {
            const errorBody = await response.json();
            errorMessage = errorBody?.error?.message ?? errorMessage;
          } catch {
            // Ignore JSON parsing errors for non-JSON responses
          }

          if (response.status === 401 || response.status === 403) {
            console.warn('Acceso denegado para el usuario actual:', errorMessage);
            redirectHome(errorMessage, true);
            return;
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data?.success) {
          throw new Error('API login failed');
        }

        const authToken = response.headers.get('x-auth-token');
        const refreshToken = response.headers.get('x-refresh-token');

        if (!authToken || !refreshToken) {
          console.error('Missing authentication tokens in response headers');
          redirectHome('No se pudo completar la autenticación');
          return;
        }

        apiService.setAuthTokens(authToken, refreshToken);

        // Store user data with roles if available
        if (data.data?.user) {
          localStorage.setItem('user_data', JSON.stringify(data.data.user));
        }

        if (!cancelled) {
          navigate('/');
        }
      } catch (tokenExchangeError) {
        console.error('Error durante el intercambio de tokens:', tokenExchangeError);

        const message =
          tokenExchangeError instanceof Error
            ? tokenExchangeError.message
            : 'Error during token exchange';

        const isAuth0Error =
          tokenExchangeError instanceof Error &&
          typeof (tokenExchangeError as any).error === 'string';

        redirectHome(message, isAuth0Error);
      }
    };

    handleToken();

    return () => {
      cancelled = true;
    };
  }, [
    error,
    isLoading,

  ]);

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
