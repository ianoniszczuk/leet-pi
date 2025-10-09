import dotenv from 'dotenv';

dotenv.config();

const config = {
  server: {
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
  },
  codeJudge: {
    url: process.env.CODE_JUDGE_URL || "",
    timeout: parseInt(process.env.CODE_JUDGE_TIMEOUT || ""),
  },
  cors: {
    origin: process.env.CORS_ORIGIN,
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
