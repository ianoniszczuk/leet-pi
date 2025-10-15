import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { apiService } from '@/services/api';
import type { Auth0User } from '@/types';

export const useAuth = () => {
  const {
    user: auth0User,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    error: auth0Error,
  } = useAuth0();

  // Limpiar tokens cuando el usuario no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      apiService.clearAuthTokens();
    }
  }, [isAuthenticated]);

  const login = () => {
    loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin + '/callback',
      },
    });
  };

  const handleLogout = () => {
    apiService.clearAuthTokens();
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  return {
    user: auth0User as Auth0User | undefined,
    isAuthenticated,
    isLoading,
    login,
    logout: handleLogout,
    error: auth0Error,
  };
};
