# TP Tecnologías Web — Backend (NestJS + PostgreSQL)

**Trabajo Práctico Especial** de la materia Tecnologías Web (TUARI). Este repositorio es la
**Entrega 1 (backend + Postman)** y es la API que consume el **frontend de la Entrega 2**.

API REST para administrar **bandas** y sus **géneros musicales** (relación 1 a N).

## Deploy

| Parte | URL |
|---|---|
| **API (Render)** | https://tp-tecweb-backend.onrender.com |
| **Frontend (Netlify)** | https://courageous-dango-2e1b41.netlify.app |

Ejemplo: https://tp-tecweb-backend.onrender.com/generos

> El servicio usa el plan gratuito de Render, que **duerme la instancia por inactividad**: la
> primera petición puede tardar hasta ~40 segundos. Luego responde normal.

## Modelo de datos

```
Género (1) ──────< (N) Banda
```

- **Género** — `id`, `nombre` (único)
- **Banda** — `id`, `nombre`, `pais`, `anioFormacion`, `generoId` (FK a Género)

La foreign key vive en `Banda` (lado N), en la columna `genero_id`.

## Tecnologías

- **NestJS 11** — framework de servidor (módulos, controllers, services, DI)
- **TypeORM** — ORM para la persistencia
- **PostgreSQL 15** — base de datos relacional (corre en Docker)
- **class-validator / class-transformer** — validación de DTOs

## Endpoints

| Verbo | Ruta | Descripción | Éxito |
|---|---|---|---|
| GET | `/generos` | Listar géneros | 200 |
| GET | `/generos/:id` | Obtener un género | 200 |
| POST | `/generos` | Crear un género | 201 |
| PUT | `/generos/:id` | Actualizar un género | 200 |
| DELETE | `/generos/:id` | Eliminar un género | 204 |
| GET | `/bandas` | Listar bandas (con su género) | 200 |
| GET | `/bandas?generoId=N` | Filtrar bandas por género | 200 |
| GET | `/bandas/:id` | Obtener una banda | 200 |
| POST | `/bandas` | Crear una banda | 201 |
| PUT | `/bandas/:id` | Actualizar una banda | 200 |
| DELETE | `/bandas/:id` | Eliminar una banda | 204 |

## Puesta en marcha

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear el archivo `.env` en la raíz (podés copiar `.env.example`) con las credenciales de la base:

   ```env
   DB_TYPE=postgres
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=secret123!
   DB_NAME=tp_tecweb
   PORT=3000
   ```

3. Levantar PostgreSQL con Docker:

   ```bash
   docker-compose up -d
   ```

4. Correr la app (en modo desarrollo):

   ```bash
   npm run start:dev
   ```

La app queda en `http://localhost:3000`. TypeORM crea las tablas automáticamente al arrancar (`synchronize: true`).

## Deploy en Render

Configuración del servicio web:

- **Build command**: `npm install && npm run build`
- **Start command**: `npm run start:prod` (`node dist/main`, sin watch)
- **Variables de entorno**: las mismas de `.env.example`, cargadas a mano en el panel de Render
  (el `.env` no se versiona). La base es un PostgreSQL de Render y se usa su **Internal Database
  URL**.
- La app escucha en `process.env.PORT` (lo inyecta Render), no en un puerto fijo.
- **CORS** habilitado (`app.enableCors()`), para que el frontend de Netlify pueda consumir la API.

Notas:

- `synchronize: true` crea las tablas al primer arranque. Es aceptable para el TP; en un proyecto
  real se usarían migraciones.
- La colección de Postman funciona contra Render cambiando **solo** la variable `baseUrl`.

## Tests

```bash
npm test          # tests unitarios (Jest)
npm run test:e2e  # tests e2e (requiere la base levantada con docker-compose)
npm run lint      # ESLint
```

## Postman

La colección está en `postman_collection.json` (22 requests, 32 verificaciones entre casos de éxito y de error). Importarla en Postman o ejecutarla desde ahí.

Para probar contra producción, cambiar únicamente la variable `baseUrl` a
`https://tp-tecweb-backend.onrender.com` (las demás variables se completan solas con los
scripts de la colección).

## Documentación

- `HISTORIAL.md` — resumen del desarrollo, decisiones de diseño y errores resueltos.
- El log completo de la sesión con el agente de IA (`LOG-SESION-OPENCODE.json`) no se versiona
  por su tamaño (2.4 MB); se conserva aparte para la entrega.
