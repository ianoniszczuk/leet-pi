import type { Request, Response } from 'express';
import { formatSuccessResponse, formatErrorResponse } from '../utils/responseFormatter.ts';
import jwtService from '../services/jwtService.ts';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json(formatErrorResponse('User not authenticated', 401));
      return;
    }

    try {
      const { authToken, refreshToken } = jwtService.generateTokens({
        sub: req.user.sub,
        email: req.user.email,
      });

      res.setHeader('X-Auth-Token', authToken);
      res.setHeader('X-Refresh-Token', refreshToken);

      res
        .status(200)
        .json(formatSuccessResponse({
          user: {
            sub: req.user.sub,
            email: req.user.email,
          },
        }, 'Login successful'));
    } catch (error) {
      console.error('Error generating JWT tokens:', error);
      res.status(500).json(formatErrorResponse('Failed to generate tokens', 500));
    }
  }
}

export default new AuthController();
