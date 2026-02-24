# Backend - MVP Evaluación de Ejercicios de Programación

Backend escalable para un MVP que permite a estudiantes subir soluciones de ejercicios de programación en C y recibir feedback automático.

## 🚀 Características

- **Autenticación con Auth0** para gestión segura de usuarios
- **Arquitectura modular** con separación clara de responsabilidades
- **Validación robusta** de entradas usando Joi
- **Manejo centralizado de errores** con respuestas consistentes
- **Logging estructurado** para debugging y monitoreo
- **Seguridad** con Helmet y CORS configurado
- **Base de datos PostgreSQL** con TypeORM
- **Comunicación asíncrona** con el juez de código
- **Preparado para escalar** con estructura de carpetas organizada

## 📁 Estructura del Proyecto

```
back-end/
├── config/           # Configuración centralizada
├── controllers/      # Lógica de negocio
├── database/         # Configuración de base de datos
├── entities/         # Entidades TypeORM
├── middleware/       # Middleware personalizado
├── migrations/       # Migraciones de base de datos
├── routes/          # Definición de rutas
├── services/        # Servicios externos
├── utils/           # Utilidades y helpers
├── index.ts         # Punto de entrada
└── package.json     # Dependencias
```

## 🛠️ Instalación

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   ```bash
   # Crear archivo .env basado en config/config.ts
   PORT=3001
   NODE_ENV=development
   
   # Base de datos
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_NAME=leet_pi_db
   
   # Code Judge Service
   CODE_JUDGE_URL=http://localhost:5000
   CODE_JUDGE_TIMEOUT=30000
   
   # CORS
   CORS_ORIGIN=http://localhost:3000
   
   # Logging
   LOG_LEVEL=info
   
   # Auth0 (ver AUTH0_SETUP.md para configuración completa)
   AUTH0_DOMAIN=your-domain.auth0.com
   AUTH0_AUDIENCE=your-api-identifier
   AUTH0_ISSUER=https://your-domain.auth0.com/
   AUTH0_JWKS_URI=https://your-domain.auth0.com/.well-known/jwks.json
   ```

3. **Levantar la base de datos:**

   > La aplicación requiere PostgreSQL 15+ corriendo en `localhost:5432`. Podés levantarla con Docker (recomendado para desarrollo) o usar una instancia nativa.

   **Opción A — Docker (recomendado):**
   ```bash
   docker run -d \
     --name leet-pi-db \
     -e POSTGRES_USER=your_username \
     -e POSTGRES_PASSWORD=your_password \
     -e POSTGRES_DB=leet_pi_db \
     -p 5432:5432 
   ```

   Para detenerla / reiniciarla:
   ```bash
   docker stop leet-pi-db
   docker start leet-pi-db
   ```

   **Opción B — PostgreSQL instalado localmente:**
   ```bash
   # Ubuntu / Debian
   sudo service postgresql start

   # macOS (Homebrew)
   brew services start postgresql@15

   # Crear la base de datos (si no existe)
   psql -U your_username -c "CREATE DATABASE leet_pi_db;"
   ```

   Verificá la conexión antes de continuar:
   ```bash
   psql -h localhost -U your_username -d leet_pi_db -c "SELECT 1;"
   ```

4. **Ejecutar migraciones:**
   ```bash
   npm run migrations:run
   ```

5. **Ejecutar el servidor:**
   ```bash
   # Desarrollo
   npm run dev

   # Producción
   npm start
   ```

   La documentación OpenAPI estará disponible en:
   ```
   http://localhost:<PORT>/api/docs
   ```

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Autenticación (Auth0)
```
GET /api/users/me          # Obtener usuario actual (requiere auth)
GET /api/users/profile      # Obtener perfil completo (requiere auth)
GET /api/users              # Listar todos los usuarios (requiere auth)
GET /api/users/:id          # Obtener usuario por ID (requiere auth)
DELETE /api/users/:id       # Eliminar usuario (requiere auth)
```

### Submissions (Protegidas)
```
POST /api/submissions      # Enviar solución (requiere auth)
GET /api/submissions/my     # Mis submissions (requiere auth)
GET /api/submissions/:id    # Submission específica (requiere auth)
```

### Submissions (Públicas)
```
GET /api/submissions/:id/status  # Estado de submission
```

### Ejemplo de Envío de Solución (Autenticado)
```
POST /api/submissions
Authorization: Bearer <auth0-token>
Content-Type: application/json

{
  "exerciseNumber": 1,
  "guideNumber": 1,
  "code": "#include <stdio.h>\nint main() { return 0; }"
}
```

## 🔄 Flujo de Evaluación

1. **Usuario se autentica** con Auth0
2. **Frontend envía** código, número de ejercicio y guía con token de autorización
3. **Backend valida** token y sincroniza usuario con Auth0
4. **Backend valida** la entrada usando Joi
5. **Backend verifica** que el ejercicio existe y está habilitado
6. **Backend envía** al juez de código via POST
7. **Juez procesa** y ejecuta los tests
8. **Backend recibe** resultados y los formatea
9. **Backend guarda** submission en la base de datos
10. **Frontend recibe** respuesta estructurada

## 📊 Formato de Respuesta

### Respuesta Exitosa
```json
{
  "success": true,
  "message": "Solution submitted successfully",
  "data": {
    "submissionId": "uuid-v4",
    "overallStatus": "approved|failed|compilation_error|pending",
    "message": "All tests passed successfully",
    "score": 100,
    "totalTests": 5,
    "passedTests": 5,
    "failedTests": 0,
    "compilationError": null,
    "testResults": [...],
    "executionTime": "0.002s",
    "memoryUsage": "1024KB",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Respuesta de Error
```json
{
  "success": false,
  "error": {
    "message": "Validation error",
    "statusCode": 400,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Linting
npm run lint

# Formateo de código
npm run format
```

## 🚀 Escalabilidad

### Estructura Preparada para Crecimiento

- **Separación de responsabilidades** clara entre capas
- **Middleware modular** fácil de extender
- **Servicios reutilizables** para lógica de negocio
- **Validación centralizada** con esquemas Joi
- **Manejo de errores** consistente en toda la aplicación

## 🔧 Configuración

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | 3000 |
| `NODE_ENV` | Entorno de ejecución | development |
| `DB_HOST` | Host de PostgreSQL | localhost |
| `DB_PORT` | Puerto de PostgreSQL | 5432 |
| `DB_USERNAME` | Usuario de PostgreSQL | - |
| `DB_PASSWORD` | Contraseña de PostgreSQL | - |
| `DB_NAME` | Nombre de la base de datos | leet_pi_db |
| `CODE_JUDGE_URL` | URL del juez de código | http://localhost:5000 |
| `CODE_JUDGE_TIMEOUT` | Timeout para requests (ms) | 30000 |
| `CORS_ORIGIN` | Origen permitido para CORS | http://localhost:3000 |
| `LOG_LEVEL` | Nivel de logging | info |
| `AUTH0_DOMAIN` | Dominio de Auth0 | - |
| `AUTH0_AUDIENCE` | Identificador de API en Auth0 | - |
| `AUTH0_ISSUER` | Issuer de Auth0 | - |
| `AUTH0_JWKS_URI` | URI de claves públicas de Auth0 | - |

## 📝 Logs

El sistema genera logs estructurados para:
- Requests HTTP
- Errores de validación
- Comunicación con el juez de código
- Errores del sistema

## 🚨 Códigos de Error

- **Errores de autenticación**: 401 Unauthorized
- **Errores de autorización**: 403 Forbidden
- **Errores de validación**: 400 Bad Request
- **Recursos no encontrados**: 404 Not Found
- **Errores del juez**: 503 Service Unavailable
- **Errores internos**: 500 Internal Server Error

## 🔐 Autenticación

El sistema utiliza Auth0 para la autenticación de usuarios.

### Características de Seguridad

- **JWT tokens** verificados con claves públicas de Auth0
- **Middleware de autenticación** en rutas protegidas
- **Sincronización automática** de usuarios con Auth0
- **Validación de audiencia e issuer** en tokens
- **Cache de claves públicas** para mejor rendimiento


