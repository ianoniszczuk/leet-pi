import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { apiService } from '@/services/api';
import type { Auth0User, User } from '@/types';

export const useAuth = () => {
  const {
    user: auth0User,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
    error: auth0Error,
  } = useAuth0();

  // Actualizar token en el servicio de API cuando cambie
  useEffect(() => {
    const updateToken = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently();
          apiService.setAuthToken(token);
        } catch (error) {
          console.error('Error getting access token:', error);
        }
      } else {
        apiService.clearAuthToken();
      }
    };

    updateToken();
  }, [isAuthenticated, getAccessTokenSilently]);

  const login = () => {
    loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin + '/callback',
      },
    });
  };

  const handleLogout = () => {
    apiService.clearAuthToken();
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
