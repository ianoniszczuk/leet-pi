import jwt from 'jsonwebtoken';
import config from '../config/config.ts';

export interface TokenPair {
  authToken: string;
  refreshToken: string;
}

export interface InternalTokenPayload extends jwt.JwtPayload {
  sub: string;
  email?: string;
}

interface TokenConfig {
  secret: string;
  audience: string;
  issuer: string;
  expiresIn: string;
}

class JwtService {
  private getAccessConfig(): TokenConfig {
    const { accessSecret, audience, issuer, accessExpiresIn } = config.jwt;

    if (!accessSecret) {
      throw new Error('JWT access secret is not configured');
    }

    return {
      secret: accessSecret,
      audience,
      issuer,
      expiresIn: accessExpiresIn,
    };
  }

  private getRefreshConfig(): TokenConfig {
    const { refreshSecret, audience, issuer, refreshExpiresIn } = config.jwt;

    if (!refreshSecret) {
      throw new Error('JWT refresh secret is not configured');
    }

    return {
      secret: refreshSecret,
      audience,
      issuer,
      expiresIn: refreshExpiresIn,
    };
  }

  generateTokens(user: Pick<InternalTokenPayload, 'sub' | 'email'>): TokenPair {
    const accessConfig = this.getAccessConfig();
    const refreshConfig = this.getRefreshConfig();

    const payload = {
      sub: user.sub,
      email: user.email,
    };

    const authToken = jwt.sign(payload, accessConfig.secret, {
      expiresIn: accessConfig.expiresIn,
      audience: accessConfig.audience,
      issuer: accessConfig.issuer,
    });

    const refreshToken = jwt.sign(payload, refreshConfig.secret, {
      expiresIn: refreshConfig.expiresIn,
      audience: refreshConfig.audience,
      issuer: refreshConfig.issuer,
    });

    return { authToken, refreshToken };
  }

  verifyAuthToken(token: string): InternalTokenPayload {
    const { secret, audience, issuer } = this.getAccessConfig();
    return jwt.verify(token, secret, {
      audience,
      issuer,
    }) as InternalTokenPayload;
  }

  verifyRefreshToken(token: string): InternalTokenPayload {
    const { secret, audience, issuer } = this.getRefreshConfig();
    return jwt.verify(token, secret, {
      audience,
      issuer,
    }) as InternalTokenPayload;
  }
}

export default new JwtService();
