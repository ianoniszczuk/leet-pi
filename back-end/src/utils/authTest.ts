/**
 * Utilidad para probar la configuración de Auth0
 * Este archivo puede ser eliminado después de verificar que todo funciona
 */

import config from '../config/config.js';

export function validateAuth0Config(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.auth0.domain) {
    errors.push('AUTH0_DOMAIN is not set');
  }

  if (!config.auth0.audience) {
    errors.push('AUTH0_AUDIENCE is not set');
  }

  if (!config.auth0.issuer) {
    errors.push('AUTH0_ISSUER is not set');
  }

  if (!config.auth0.jwksUri) {
    errors.push('AUTH0_JWKS_URI is not set');
  }

  // Validar formato de URLs
  if (config.auth0.domain && !config.auth0.domain.includes('.auth0.com')) {
    errors.push('AUTH0_DOMAIN should be in format: your-domain.auth0.com');
  }

  if (config.auth0.issuer && !config.auth0.issuer.startsWith('https://')) {
    errors.push('AUTH0_ISSUER should start with https://');
  }

  if (config.auth0.jwksUri && !config.auth0.jwksUri.startsWith('https://')) {
    errors.push('AUTH0_JWKS_URI should start with https://');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function printAuth0Config(): void {
  console.log('🔐 Auth0 Configuration:');
  console.log(`Domain: ${config.auth0.domain || 'NOT SET'}`);
  console.log(`Audience: ${config.auth0.audience || 'NOT SET'}`);
  console.log(`Issuer: ${config.auth0.issuer || 'NOT SET'}`);
  console.log(`JWKS URI: ${config.auth0.jwksUri || 'NOT SET'}`);
  
  const validation = validateAuth0Config();
  if (validation.isValid) {
    console.log('✅ Auth0 configuration is valid');
  } else {
    console.log('❌ Auth0 configuration has errors:');
    validation.errors.forEach(error => console.log(`  - ${error}`));
  }
}
