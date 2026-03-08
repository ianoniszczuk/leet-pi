# Code Judge Service

Este servicio evalúa código C usando casos de prueba (test harness) y retorna resultados estructurados según las especificaciones del sistema. Cada ejecución corre dentro de un **sandbox nsjail** que aísla el proceso con namespaces y cgroups de Linux.

## Características

- Compila código C con gcc usando flags `-std=c23 -Wall -Wextra -lm`
- Ejecuta test harness y evalúa resultado por exit code (`0` = passed)
- Calcula puntuación basada en tests pasados/totales
- Maneja timeouts y errores de compilación/ejecución
- **Sandbox nsjail** (opcional): aísla cada ejecución con límites de memoria, procesos, filesystem y red
- API REST con endpoints `/evaluate`, `/health` y `/tests/*`

## Sandbox (nsjail)

Cada binario compilado se ejecuta dentro de un jail de [nsjail](https://github.com/google/nsjail) que provee:

| Protección | Mecanismo | Configuración |
|---|---|---|
| **Memoria** | `rlimit_as` + `cgroup_mem_max` | Según `memoryLimit` del request (default 256 MB) |
| **Tiempo** | `time_limit` de nsjail + timeout Python | Según `timeout` del request (default 5s) |
| **Fork bombs** | `rlimit_nproc 1` | Solo 1 proceso permitido |
| **Filesystem** | chroot con mount R/O | Solo el ejecutable montado, `/tmp` vacío |
| **Red** | Network namespace aislado | Sin interfaces de red |
| **Procesos** | PID namespace | Árbol de procesos eliminado al terminar |

### Retrocompatibilidad

El sandbox se controla con la variable de entorno `NSJAIL_ENABLED`:
- `NSJAIL_ENABLED=true` — ejecución dentro de nsjail (default en docker-compose)
- `NSJAIL_ENABLED=false` o no definida — ejecución directa legacy

Cuando nsjail está habilitado, el código se compila con `-static` para obtener un binario autónomo que puede correr dentro del chroot minimal.

## Estructura de Tests

Los tests usan un modelo de **test harness** (no stdin/stdout). Cada ejercicio tiene un archivo `.c` con `main()` y asserts:
```
/tests/
  guide-1/
    exercise-1.c
    exercise-2.c
  guide-2/
    exercise-1.c
```

El código del estudiante debe **definir las funciones** que el harness declara e invoca — no implementar `main()`.

### Montaje en Docker

Para que el contenedor tenga acceso a estos archivos, la carpeta local de tests (`$CODE_JUDGE_TESTS_PATH` definida en el `.env` del root) se expone al sistema de archivos interno de Docker mediante un **volume_mount** en el archivo `docker-compose.yml`:
```yaml
volumes:
  - ${CODE_JUDGE_TESTS_PATH}:/tests
```
Al correr en producción o desarrollo, FastAPI y el compilador leen los *harness* directamente de ese punto de montaje de solo lectura (`/tests`), manteniéndolos persistentes y sincronizados sin necesidad de reconstruir la imagen de Docker entera cada vez que se agrega un ejercicio nuevo.

## API Endpoints

### POST /evaluate
Evalúa código C contra el test harness del ejercicio.

**Request:**
```json
{
  "submissionId": "uuid-v4",
  "guideNumber": 1,
  "exerciseNumber": 1,
  "code": "int multiplyByTwo(int x) { return x * 2; }",
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
    "totalTests": 1,
    "passedTests": 1,
    "failedTests": 0,
    "testResults": [
      {
        "testNumber": 1,
        "passed": true,
        "executionTime": "0.50 ms",
        "error": null
      }
    ]
  },
  "score": 100,
  "executionTime": "0.50 ms",
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

### POST /tests/upload
Sube un archivo de test harness `.c` para un ejercicio (form-data con `guideNumber`, `exerciseNumber`, `file`).

### GET /tests/{guide_number}/{exercise_number}
Descarga el test harness de un ejercicio.

### DELETE /tests/{guide_number}/{exercise_number}
Elimina el test harness de un ejercicio.

## Docker

### Build
```bash
# Dev (con hot-reload)
docker build --target dev -t code-judge:dev ./juez-codigo

# Producción
docker build --target prod -t code-judge:latest ./juez-codigo
```

### Run
```bash
docker run -d \
  --name code-judge \
  --privileged \
  -p 5000:5000 \
  -e NSJAIL_ENABLED=true \
  -v /path/to/host/tests:/tests:ro \
  --memory=256m \
  --cpus=1 \
  --restart=unless-stopped \
  code-judge:latest
```

> **Nota:** `--privileged` es necesario para que nsjail pueda crear namespaces y cgroups.

## Variables de Entorno

| Variable | Default | Descripción |
|---|---|---|
| `NSJAIL_ENABLED` | `false` | Habilita el sandbox nsjail |
| `TESTS_BASE_PATH` | `/tests` | Ruta base para los test harness |
| `SUBMISSIONS_BASE_PATH` | — | Ruta base para submissions (opcional) |

## Testing

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
    "code": "int multiplyByTwo(int x) { return x * 2; }",
    "language": "c",
    "timeout": 5000,
    "memoryLimit": 256,
    "timestamp": "2024-01-01T00:00:00Z"
  }'
```

## Estructura del Proyecto

- `main.py` — Aplicación FastAPI principal
- `models/schemas.py` — Modelos Pydantic para request/response
- `router/execute.py` — Endpoint `/evaluate`
- `router/tests.py` — Endpoints `/tests/*` (upload/download/delete)
- `services/code_executor.py` — Lógica de compilación, sandbox y evaluación
- `tests/` — Test harness organizados por guía y ejercicio
- `Dockerfile` — Multi-stage build (nsjail-builder → deps → dev/prod)
- `.env-example` — Variables de entorno documentadas