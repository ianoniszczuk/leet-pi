import 'reflect-metadata'
import express from 'express'
import AppDataSource from '@/database/data-source.ts'
import cors from 'cors'
import helmet from 'helmet'
import config from '@/config/config.ts'
import routes from '@/routes/index.ts'
import { errorHandler } from '@/middleware/errorHandler.ts'
import { printAuth0Config } from './utils/authTest.ts'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  exposedHeaders: ['X-Auth-Token', 'X-Refresh-Token'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// OpenAPI / Swagger UI
const openapiPath = process.env.OPENAPI_PATH ?? path.resolve(__dirname, '../../docs/openapi.yaml')
const swaggerDocument = YAML.load(openapiPath)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// API routes
app.use('/api', routes);

// Global error handler (must be last)
app.use(errorHandler);

// Initialize DB and start server
const start = async () => {
  try {
    await AppDataSource.initialize();
    console.log('📦 Database connected');

    // Ejecutar migraciones pendientes automáticamente
    const pendingMigrations = await AppDataSource.showMigrations();
    if (pendingMigrations) {
      console.log('🔄 Running pending migrations...');
      await AppDataSource.runMigrations();
      console.log('✅ Migrations applied');
    } else {
      console.log('✅ Migrations up to date');
    }

    // Validar configuración de Auth0
    printAuth0Config();

    const PORT = config.server.port;
    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${config.server.nodeEnv} mode`);
      console.log(`📍 Server running at http://localhost:${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`👤 User endpoints: http://localhost:${PORT}/api/users`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
      console.log(`📝 Submission endpoints: http://localhost:${PORT}/api/submissions`);
      console.log(`📖 API Docs: http://localhost:${PORT}/api/docs`);
    });
  } catch (err) {
    console.error('❌ Failed to initialize database', err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  try { await AppDataSource.destroy(); } catch { }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  try { await AppDataSource.destroy(); } catch { }
  process.exit(0);
});
