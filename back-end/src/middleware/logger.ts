import morgan from 'morgan'
import fs from 'fs'
import path from 'path'

const isProduction = process.env.NODE_ENV === 'production'

const LOG_DIR = '/app/logs'

function getFileStream() {
  fs.mkdirSync(LOG_DIR, { recursive: true })
  const date = new Date().toISOString().slice(0, 10)
  const filePath = path.join(LOG_DIR, `${date}.logs`)
  return fs.createWriteStream(filePath, { flags: 'a' })
}

// Development: morgan 'dev' (colorizado, timing) → consola
// Production:  morgan 'combined' (Apache Combined) → archivo por fecha
const logger = isProduction
  ? morgan('combined', { stream: getFileStream() })
  : morgan('dev')

export default logger;
