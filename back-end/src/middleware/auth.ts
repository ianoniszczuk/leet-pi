import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import config from '../config/config.js';

// JWKS client para obtener las claves públicas de Auth0
const client = jwksClient({
  jwksUri: config.auth0.jwksUri,
  cache: true,
  cacheMaxAge: 600000, // 10 minutos
  rateLimit: true,
  jwksRequestsPerMinute: 5,
});

// Función para obtener la clave de verificación
function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

// Interfaz para el payload del token JWT
export interface Auth0Payload {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
  [key: string]: any;
}

// Extender la interfaz Request para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: Auth0Payload;
    }
  }
}

// Middleware de autenticación
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Access token required',
        statusCode: 401,
      },
    });
  }

  // Verificar el token JWT
  jwt.verify(token, getKey, {
    audience: config.auth0.audience,
    issuer: config.auth0.issuer,
    algorithms: ['RS256'],
  }, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Invalid or expired token',
          statusCode: 403,
        },
      });
    }
    
    // Agregar el usuario decodificado al request
    req.user = decoded as Auth0Payload;
    next();
  });
};

// Middleware opcional para rutas que pueden funcionar con o sin autenticación
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Si no hay token, continuar sin usuario autenticado
    return next();
  }

  // Si hay token, verificar y agregar usuario si es válido
  jwt.verify(token, getKey, {
    audience: config.auth0.audience,
    issuer: config.auth0.issuer,
    algorithms: ['RS256'],
  }, (err, decoded) => {
    if (!err && decoded) {
      req.user = decoded as Auth0Payload;
    }
    next();
  });
};

export default { authenticateToken, optionalAuth };
