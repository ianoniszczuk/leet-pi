# Backend - MVP Evaluación de Ejercicios de Programación

Backend escalable para un MVP que permite a estudiantes subir soluciones de ejercicios de programación en C y recibir feedback automático.

## 🚀 Características

- **Arquitectura modular** con separación clara de responsabilidades
- **Validación robusta** de entradas usando Joi
- **Manejo centralizado de errores** con respuestas consistentes
- **Logging estructurado** para debugging y monitoreo
- **Seguridad** con Helmet y CORS configurado
- **Comunicación asíncrona** con el juez de código
- **Preparado para escalar** con estructura de carpetas organizada

## 📁 Estructura del Proyecto

```
back-end/
├── config/           # Configuración centralizada
├── controllers/      # Lógica de negocio
├── middleware/       # Middleware personalizado
├── models/          # Modelos de datos (futuro)
├── routes/          # Definición de rutas
├── services/        # Servicios externos
├── utils/           # Utilidades y helpers
├── index.js         # Punto de entrada
└── package.json     # Dependencias
```

## 🛠️ Instalación

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   ```bash
   # Crear archivo .env basado en config/config.js
   PORT=3000
   NODE_ENV=development
   CODE_JUDGE_URL=http://localhost:5000
   CODE_JUDGE_TIMEOUT=30000
   CORS_ORIGIN=http://localhost:3000
   LOG_LEVEL=info
   ```

3. **Ejecutar el servidor:**
   ```bash
   # Desarrollo
   npm run dev
   
   # Producción
   npm start
   ```

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Enviar Solución
```
POST /api/submissions
Content-Type: application/json

{
  "exerciseNumber": 1,
  "code": "#include <stdio.h>\nint main() { return 0; }"
}
```

### Consultar Estado
```
GET /api/submissions/:submissionId/status
```

## 🔄 Flujo de Evaluación

1. **Frontend envía** código y número de ejercicio
2. **Backend valida** la entrada usando Joi
3. **Backend envía** al juez de código via POST
4. **Juez procesa** y ejecuta los tests
5. **Backend recibe** resultados y los formatea
6. **Frontend recibe** respuesta estructurada

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
| `CODE_JUDGE_URL` | URL del juez de código | http://localhost:5000 |
| `CODE_JUDGE_TIMEOUT` | Timeout para requests (ms) | 30000 |
| `CORS_ORIGIN` | Origen permitido para CORS | http://localhost:3000 |
| `LOG_LEVEL` | Nivel de logging | info |

## 📝 Logs

El sistema genera logs estructurados para:
- Requests HTTP
- Errores de validación
- Comunicación con el juez de código
- Errores del sistema

## 🚨 id Errores

- **Errores de validación**: 400 Bad Request
- **Errores del juez**: 503 Service Unavailable
- **Errores internos**: 500 Internal Server Error
- **Rutas no encontradas**: 404 Not Found


