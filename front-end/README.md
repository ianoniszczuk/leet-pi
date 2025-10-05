# Leet PI Frontend

Frontend MVP para el sistema de evaluación de ejercicios de programación en C. Desarrollado con React + TypeScript y autenticación Auth0.

## 🚀 Características

- **Autenticación segura** con Auth0
- **Interfaz moderna** con Tailwind CSS
- **Envío de código** con editor integrado
- **Resultados detallados** de evaluación
- **Historial de submissions** con estadísticas
- **Perfil de usuario** con métricas de progreso
- **Diseño responsivo** para móviles y desktop

## 🛠️ Tecnologías

- **React 18** con TypeScript
- **Vite** como bundler
- **Tailwind CSS** para estilos
- **Auth0 React SDK** para autenticación
- **Axios** para comunicación con API
- **React Router** para navegación
- **Lucide React** para iconos

## 📦 Instalación

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   ```bash
   # Copiar archivo de ejemplo
   cp .env.example .env
   
   # Editar .env con tus valores
   VITE_AUTH0_DOMAIN=tu-dominio.auth0.com
   VITE_AUTH0_CLIENT_ID=tu-client-id
   VITE_AUTH0_AUDIENCE=tu-api-identifier
   VITE_AUTH0_REDIRECT_URI=http://localhost:3000/callback
   VITE_API_BASE_URL=http://localhost:3001/api
   ```

3. **Configurar Auth0:**
   - Crear una aplicación Single Page Application en Auth0
   - Configurar las URLs permitidas:
     - Allowed Callback URLs: `http://localhost:3000/callback`
     - Allowed Logout URLs: `http://localhost:3000`
     - Allowed Web Origins: `http://localhost:3000`

4. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

5. **Construir para producción:**
   ```bash
   npm run build
   ```

## 🔧 Configuración de Auth0

### Pasos detallados:

1. **Crear cuenta en Auth0**
   - Ve a [auth0.com](https://auth0.com) y crea una cuenta gratuita

2. **Crear una API**
   - En el dashboard de Auth0, ve a "Applications" > "APIs"
   - Crea una nueva API
   - Anota el "Identifier" (este será tu `VITE_AUTH0_AUDIENCE`)

3. **Crear una aplicación SPA**
   - Ve a "Applications" > "Applications"
   - Crea una nueva aplicación (Single Page Application)
   - Anota el "Domain" (este será tu `VITE_AUTH0_DOMAIN`)
   - Anota el "Client ID" (este será tu `VITE_AUTH0_CLIENT_ID`)

4. **Configurar las URLs**
   - En la configuración de tu aplicación, agrega:
     - **Allowed Callback URLs**: `http://localhost:3000/callback`
     - **Allowed Logout URLs**: `http://localhost:3000`
     - **Allowed Web Origins**: `http://localhost:3000`

## 📱 Funcionalidades

### Páginas Principales

- **Inicio** (`/`): Página de bienvenida con información del sistema
- **Enviar Código** (`/submit`): Interfaz para enviar soluciones en C
- **Mis Envíos** (`/submissions`): Historial de todas las submissions
- **Perfil** (`/profile`): Información del usuario y estadísticas

### Características de Autenticación

- Login/logout con Auth0
- Protección de rutas privadas
- Gestión automática de tokens
- Perfil de usuario sincronizado

### Interfaz de Envío de Código

- Editor de código con sintaxis C
- Selección de guía y ejercicio
- Validación de entrada
- Resultados detallados en tiempo real

### Resultados de Evaluación

- Estado general (aprobado/reprobado)
- Puntuación y porcentaje de éxito
- Detalles de cada test individual
- Información de rendimiento (tiempo, memoria)
- Errores de compilación si los hay

## 🎨 Diseño

El frontend utiliza un diseño moderno y limpio con:

- **Paleta de colores** consistente con el sistema
- **Tipografía** clara y legible
- **Iconos** de Lucide React
- **Componentes** reutilizables
- **Estados de carga** y error
- **Animaciones** sutiles
- **Responsive design** para todos los dispositivos

## 🔒 Seguridad

- Autenticación JWT con Auth0
- Tokens almacenados de forma segura
- Validación de entrada en frontend y backend
- Protección CSRF con tokens Auth0
- Rutas protegidas para funcionalidades sensibles

## 📊 API Integration

El frontend se comunica con el backend a través de:

- **Health Check**: `/api/health`
- **Usuarios**: `/api/users/*`
- **Submissions**: `/api/submissions/*`

Todas las requests incluyen el token de autorización automáticamente.

## 🚀 Despliegue

Para desplegar en producción:

1. **Configurar variables de entorno de producción**
2. **Actualizar URLs de Auth0** para el dominio de producción
3. **Construir la aplicación**: `npm run build`
4. **Servir archivos estáticos** desde la carpeta `dist/`

## 📝 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run preview` - Vista previa de producción
- `npm run lint` - Linting del código
- `npm run type-check` - Verificación de tipos TypeScript

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
