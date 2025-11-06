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
      const user = await userService.syncFromAuth0WithEnabledCheck(auth0User);

      if (!user) {
        res.status(403).json(formatErrorResponse('User is not registered in the platform', 403));
        return;
      }

      if (!user.enabled || !user.sub) {
        res.status(403).json(formatErrorResponse('User account is disabled', 403));
        return;
      }

      const roles = (user.userRoles ?? []).map((userRole) => userRole.roleId);

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
      // Si el error es de usuario no habilitado, retornar 403
      if (error.statusCode === 403) {
        res.status(403).json(formatErrorResponse(error.message || 'Usuario no habilitado para acceder a la plataforma', 403));
        return;
      }
      console.error('Error in login:', error);
      res.status(500).json(formatErrorResponse('Failed to process login', 500));
    }
  }
}

export default new AuthController();
