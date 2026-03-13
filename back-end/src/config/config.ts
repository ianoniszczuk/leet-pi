import dotenv from 'dotenv';

dotenv.config();

const config = {
  server: {
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
  },
  codeJudge: {
    url: process.env.CODE_JUDGE_URL || "http://localhost:5000",
    timeout: parseInt(process.env.CODE_JUDGE_TIMEOUT || "30000"),
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.includes(',')
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : process.env.CORS_ORIGIN,
  },
  logging: {
    level: process.env.LOG_LEVEL,
  },
  auth0: {
    domain: process.env.AUTH0_DOMAIN || "",
    audience: process.env.AUTH0_AUDIENCE || "",
    issuer: process.env.AUTH0_ISSUER || "",
    jwksUri: process.env.AUTH0_JWKS_URI || "",
  },
  mailer: {
    host: process.env.MAILER_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAILER_PORT || '587'),
    secure: process.env.MAILER_SECURE === 'true',
    user: process.env.MAILER_USER || '',
    pass: process.env.MAILER_PASS || '',
    from: process.env.MAILER_FROM || '',
  },
  appUrl: process.env.APP_URL || 'http://localhost:8080',
  jwt: {
    accessSecret: process.env.API_JWT_SECRET || "",
    refreshSecret: process.env.API_REFRESH_SECRET || "",
    issuer: process.env.API_JWT_ISSUER || "leetpi-api",
    audience: process.env.API_JWT_AUDIENCE || "leetpi-clients",
    accessExpiresIn: process.env.API_JWT_ACCESS_EXPIRES_IN || "7d",
    refreshExpiresIn: process.env.API_JWT_REFRESH_EXPIRES_IN || "30d",
  },
};

export default config;
