# Code Judge Service

Este servicio evalúa código C usando casos de prueba y retorna resultados estructurados según las especificaciones del sistema.

## Características

- Compila código C con gcc usando flags estándar
- Ejecuta casos de prueba con entrada/salida
- Compara resultados y calcula puntuación
- Maneja timeouts y errores de compilación/ejecución
- API REST con endpoints `/evaluate` y `/health`

## Estructura de Tests

Los tests deben estar organizados en la siguiente estructura:
```
/tests/
  guide-1/
    exercise-1/
      test-1.in
      test-1.out
      test-2.in
      test-2.out
      metadata.json (opcional)
```

## API Endpoints

### POST /evaluate
Evalúa código C contra casos de prueba.

**Request:**
```json
{
  "submissionId": "uuid-v4",
  "guideNumber": 1,
  "exerciseNumber": 1,
  "code": "#include <stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    printf(\"%d\", n * 2);\n    return 0;\n}",
  "language": "c",
  "timeout": 5000,
  "memoryLimit": 256,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Response:**
```json
{
  "submissionId": "uuid-v4",
  "status": "completed",
  "compilation": {
    "success": true,
    "output": null,
    "errors": null
  },
  "execution": {
    "totalTests": 2,
    "passedTests": 2,
    "failedTests": 0,
    "testResults": [
      {
        "testNumber": 1,
        "passed": true,
        "executionTime": "0.002s",
        "error": null
      },
      {
        "testNumber": 2,
        "passed": true,
        "executionTime": "0.001s",
        "error": null
      }
    ]
  },
  "score": 100,
  "executionTime": "0.125s",
  "memoryUsage": "N/A",
  "timestamp": "2024-01-01T00:00:01Z"
}
```

### GET /health
Verifica el estado del servicio.

**Response:**
```json
{
  "status": "ok"
}
```

## Docker

### Build
```bash
docker build -t code-judge:latest ./juez-codigo
```

### Run
```bash
docker run -d \
  --name code-judge \
  -p 5000:5000 \
  -v /path/to/host/tests:/tests:ro \
  -v /path/to/host/submissions:/tmp/submissions \
  --memory=256m \
  --cpus=1 \
  --restart=unless-stopped \
  code-judge:latest
```

### Ejemplo con tests locales

**PowerShell:**
```powershell
docker run -d --name code-judge -p 5000:5000 -v "$(Get-Location)\juez-codigo\tests:/tests:ro" -v "$(Get-Location)\submissions:/tmp/submissions" --memory=256m --cpus=1 --restart=unless-stopped code-judge:latest
```

**Bash/Linux:**
```bash
docker run -d --name code-judge -p 5000:5000 -v $(pwd)/juez-codigo/tests:/tests:ro -v $(pwd)/submissions:/tmp/submissions --memory=256m --cpus=1 --restart=unless-stopped code-judge:latest
```

## Testing

Para probar el servicio:

```bash
# Health check
curl http://localhost:5000/health

# Evaluación de código
curl -X POST http://localhost:5000/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "submissionId": "test-123",
    "guideNumber": 1,
    "exerciseNumber": 1,
    "code": "#include <stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    printf(\"%d\", n * 2);\n    return 0;\n}",
    "language": "c",
    "timeout": 5000,
    "memoryLimit": 256,
    "timestamp": "2024-01-01T00:00:00Z"
  }'
```

## Estructura del Proyecto

- `main.py` - Aplicación FastAPI principal
- `models/schemas.py` - Modelos Pydantic para request/response
- `router/execute.py` - Endpoints de la API
- `services/code_executor.py` - Lógica de compilación y evaluación
- `tests/` - Casos de prueba organizados por guía y ejercicio
- `Dockerfile` - Configuración del contenedor Docker