# TP Tecnologías Web — Backend (NestJS + PostgreSQL)

**Entrega 1 del TP Especial** de la materia Tecnologías Web (TUARI).

API REST para administrar **bandas** y sus **géneros musicales** (relación 1 a N).

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

2. Crear el archivo `.env` en la raíz con las credenciales de la base:

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

## Postman

La colección está en `postman_collection.json` (22 requests, 32 verificaciones entre casos de éxito y de error). Importarla en Postman o ejecutarla desde ahí.

## Documentación

- `HISTORIAL.md` — resumen del desarrollo, decisiones de diseño y errores resueltos.
- `LOG-SESION-OPENCODE.json` — log completo de la sesión con el agente de IA.
