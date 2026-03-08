import winston from 'winston'
import Transport from 'winston-transport'
import fs from 'fs'
import path from 'path'

const isProduction = process.env.NODE_ENV === 'production'
const LOG_DIR = '/app/logs'

class DailyFileTransport extends Transport {
  private currentDate = ''
  private stream: fs.WriteStream | null = null

  private getStream(): fs.WriteStream {
    const date = new Date().toISOString().slice(0, 10)
    if (date !== this.currentDate) {
      this.stream?.end()
      fs.mkdirSync(LOG_DIR, { recursive: true })
      this.currentDate = date
      this.stream = fs.createWriteStream(path.join(LOG_DIR, `${date}.logs`), { flags: 'a' })
    }
    return this.stream!
  }

  log(info: { level: string; message: string; timestamp?: string }, callback: () => void) {
    const line = `[${info.timestamp ?? new Date().toISOString()}] [${info.level.toUpperCase()}] ${info.message}\n`
    this.getStream().write(line)
    callback()
  }
}

const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  transports: isProduction
    ? [new DailyFileTransport({
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
