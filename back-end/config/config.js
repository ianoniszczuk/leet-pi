require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  codeJudge: {
    url: process.env.CODE_JUDGE_URL || 'http://localhost:5000',
    timeout: parseInt(process.env.CODE_JUDGE_TIMEOUT) || 30000,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

module.exports = config;
