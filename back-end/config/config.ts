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
};

export default config;
