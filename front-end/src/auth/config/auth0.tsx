import { Auth0Provider } from '@auth0/auth0-react';
import { ReactNode } from 'react';

interface Auth0Config {
  domain: string;
  clientId: string;
  audience: string;
  redirectUri: string;
}

const auth0Config: Auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || '',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || '',
  audience: import.meta.env.VITE_AUTH0_AUDIENCE || '',
  redirectUri: import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin + '/callback',
};

export const Auth0ProviderWrapper = ({ children }: { children: ReactNode }) => {
  if (!auth0Config.domain || !auth0Config.clientId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Error de Configuración
          </h2>
          <p className="text-gray-600">
            Las variables de entorno de Auth0 no están configuradas correctamente.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Verifica tu archivo .env
          </p>
        </div>
      </div>
    );
  }

  return (
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={{
        ...(auth0Config.audience ? { audience: auth0Config.audience } : {}),
        redirect_uri: auth0Config.redirectUri,
        scope: 'openid profile email',
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  );
};

export default auth0Config;
