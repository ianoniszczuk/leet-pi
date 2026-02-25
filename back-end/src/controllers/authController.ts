import type { Request, Response } from 'express';
import { formatSuccessResponse, formatErrorResponse } from '../utils/responseFormatter.ts';
import jwtService from '../services/jwtService.ts';
import userService from '../services/userService.ts';
import type { Auth0Payload } from '../middleware/auth.ts';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json(formatErrorResponse('User not authenticated', 401));
      return;
    }

    try {
      const auth0User = req.user as Auth0Payload;
      console.log(`[AuthController] Login attempt for sub=${auth0User.sub} email=${auth0User.email}`);

      const user = await userService.syncFromAuth0WithEnabledCheck(auth0User);

      // syncFromAuth0WithEnabledCheck retorna null si el usuario no existe en la plataforma
      if (!user) {
        console.warn(`[AuthController] Usuario no registrado en la plataforma: ${auth0User.email}`);
        res.status(403).json(formatErrorResponse('User is not registered in the platform', 403));
        return;
      }

      // Doble chequeo de seguridad (la función ya lanza excepción si !enabled,
      // pero lo validamos aquí también en caso de que el flujo cambie en el futuro)
      if (!user.enabled || !user.sub) {
        console.warn(`[AuthController] Usuario deshabilitado o sin sub: ${user.email} enabled=${user.enabled} sub=${user.sub}`);
        res.status(403).json(formatErrorResponse('User account is disabled', 403));
        return;
      }

      const roles = (user.userRoles ?? []).map((userRole) => userRole.roleId);
      console.log(`[AuthController] Login exitoso para ${user.email}, roles=[${roles.join(', ')}]`);

      const { authToken, refreshToken } = jwtService.generateTokens({
        sub: user.sub,
        email: user.email,
        roles,
      });

      res.setHeader('X-Auth-Token', authToken);
      res.setHeader('X-Refresh-Token', refreshToken);

      res
        .status(200)
        .json(formatSuccessResponse({
          user: {
            sub: user.sub,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            enabled: user.enabled,
            roles,
          },
        }, 'Login successful'));
    } catch (error: any) {
      // syncFromAuth0WithEnabledCheck lanza un error con statusCode=403 cuando el usuario está deshabilitado
      if (error.statusCode === 403) {
        console.warn(`[AuthController] Acceso denegado (403): ${error.message}`);
        res.status(403).json(formatErrorResponse(error.message || 'Usuario no habilitado para acceder a la plataforma', 403));
        return;
      }
      console.error('[AuthController] Error inesperado en login:', error);
      res.status(500).json(formatErrorResponse('Failed to process login', 500));
    }
  }
}

export default new AuthController();
