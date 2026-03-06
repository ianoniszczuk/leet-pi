import winston from 'winston'
import fs from 'fs'
import path from 'path'

const isProduction = process.env.NODE_ENV === 'production'
const LOG_DIR = '/app/logs'

function getLogFilePath() {
  fs.mkdirSync(LOG_DIR, { recursive: true })
  const date = new Date().toISOString().slice(0, 10)
  return path.join(LOG_DIR, `${date}.logs`)
}

const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  transports: isProduction
    ? [new winston.transports.File({
        filename: getLogFilePath(),
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.printf(({ level, message, timestamp }) =>
            `[${timestamp}] [${level.toUpperCase()}] ${message}`)
        ),
      })]
    : [new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize({ level: true }),
          winston.format.printf(({ level, message }) => `${level}: ${message}`)
        ),
      })],
})

export default logger
