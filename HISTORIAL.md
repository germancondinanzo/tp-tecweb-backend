# Historial de trabajo — TP Tecnologías Web (TUARI)

Alumno: German Condinanzo
Materia: Tecnologías Web — Tecnicatura Universitaria en Administración de Redes Informáticas
Entregas: (1) Backend NestJS + Postman — (2) Frontend Angular + Deploy

---

## Entrega 1 — Backend (NestJS + PostgreSQL + Postman)

**Repo:** https://github.com/germancondinanzo/tp-tecweb-backend

### Modelo de datos

Dos entidades con relación 1 a N, generado a partir del enunciado:

- **Género** (lado 1): `id`, `nombre` (único)
- **Banda** (lado N): `id`, `nombre`, `pais`, `anioFormacion`, `generoId` (FK a Género)

```
Género (1) ──────< (N) Banda
```

La FK `genero_id` vive en `Banda`. En el modelo TypeORM:
- `Banda` tiene `@ManyToOne(() => Genero, g => g.bandas)` + `@JoinColumn({ name: 'genero_id' })`
- `Genero` tiene `@OneToMany(() => Banda, b => b.genero) bandas: Banda[]`

### Commit 1 — `feat: CRUD Géneros`

Estructura base y módulo Géneros completo:
- `nest new . --package-manager npm --skip-git` (NestJS 11)
- Dependencias: `@nestjs/typeorm`, `typeorm`, `pg`, `@nestjs/config`, `class-validator`, `class-transformer`, `@nestjs/mapped-types`
- `.env` con las credenciales de la base; `docker-compose.yml` levanta PostgreSQL 15 en el contenedor `tp-tecweb-db`
- `app.module.ts`: `ConfigModule.forRoot({ isGlobal: true })` + `TypeOrmModule.forRootAsync` (lee del `.env`, `entities` por glob, `synchronize: true`)
- Módulo `generos/`: entity, DTOs (`CreateGeneroDto`, `UpdateGeneroDto` con `PartialType`), service (CRUD + `NotFoundException`), controller (`/generos`, `ParseIntPipe`, DELETE 204), module
- `.gitignore` creado: ignora `node_modules/`, `dist/`, `.env`

**Verificación:** endpoints probados con Thunder Client. POST 201, GET 200, GET por id 200, PUT 200, DELETE 204.

### Commit 2 — `feat: CRUD Bandas con relación ManyToOne a Género`

Módulo `bandas/` completo, con la relación 1 a N:
- `banda.entity.ts`: `@ManyToOne` a Género + `@JoinColumn`; `@OneToMany` inverso en `genero.entity.ts`
- `create-banda.dto.ts`: valida `nombre`, `pais`, `anioFormacion` (`@IsNumber`, `@Min(1800)`, `@Max(2100)`), `generoId`
- `bandas.service.ts`: inyecta dos repositorios (Banda y Género) para validar que el género exista antes de crear/actualizar; si no, `BadRequestException`
- `bandas.controller.ts` + `bandas.module.ts`: mismo patrón que Géneros
- `app.module.ts` importa `BandasModule`

**Errores resueltos durante el proceso:**

1. **`relations: ['bandas']` no compilaba (TS2559).** TypeORM 0.3+ cambió la sintaxis de `relations`: es un objeto, no un array. Correcto: `relations: { banda: true }`.
2. **`GeneroRepository` no se podía inyectar en `BandasService` (`UnknownDependenciesException`).** `GenerosModule` tenía el repo pero no lo exportaba. Fix: `exports: [GenerosService, TypeOrmModule]` en `generos.module.ts` + `imports: [..., GenerosModule]` en `bandas.module.ts`.
3. **`Cannot find module '@nestjs/mapped-types'`.** Faltaba instalarlo: `npm install --save @nestjs/mapped-types`.
4. **TS2307 / TS18046 en `genero.entity.ts`.** La entidad Banda todavía no existía cuando se escribió el `@OneToMany`. Se quitó temporalmente hasta crear el módulo Bandas.

### Commit 3 — `feat: ValidationPipe global y filtrado de bandas por género`

- `main.ts`: `ValidationPipe` global con `whitelist: true` (elimina propiedades no declaradas en el DTO), `forbidNonWhitelisted: true` (rechaza con 400 las propiedades extra), `transform: true` (convierte tipos).
- `bandas.controller.ts`: `@Query('generoId', new ParseIntPipe({ optional: true })) generoId?: number`
- `bandas.service.ts`: `findAll(generoId?)` con `where: generoId ? { generoId } : {}`

**Verificación:** POST con `anioFormacion: "abc"` → 400. POST con propiedad extra (`"color": "azul"`) → 400 ("property extra should not exist"). `GET /bandas?generoId=4` → solo las bandas de Metal. `GET /bandas?generoId=abc` → 400.

### Commit 4 — `test: colección Postman con casos de éxito y error`

`postman_collection.json`: 22 requests, 32 verificaciones. Dos carpetas (Géneros / Bandas) con casos de éxito y de error.

**Decisiones de diseño de la colección:**

- Los requests que crean registros usan scripts de test para guardar el `id` en variables de colección, así los `GET /:id` no dependen de ids hardcodeados.
- Los nombres de género llevan `{{$randomInt}}` al final, para que la colección se pueda correr varias veces sin chocar con el índice único de `genero.nombre`.
- Los requests de Bandas usan `{{generoIdBandas}}` (el género auxiliar que crea el request 2 de Géneros). El género del request 1 sí se borra al final de su carpeta.
- El POST de bandas devuelve los datos de la banda **sin** el género anidado (decisión del alumno). Los GET sí lo incluyen, porque piden `relations: { genero: true }`.

**Casos de error cubiertos:**
- 400 por campo faltante (POST /generos sin `nombre`)
- 400 por propiedad no permitida en el body
- 400 por tipo/rango inválido (`anioFormacion: "abc"`)
- 400 por FK inexistente (`generoId: 999999`)
- 400 por query param no numérico (`?generoId=abc`)
- 400 por id no numérico en la ruta (`/generos/abc`)
- 404 por recurso inexistente (GET y DELETE)

**Errores de entorno resueltos durante las pruebas:**

- **`relation "genero" does not exist`.** Al recrear el contenedor con `docker-compose down -v` se borró el volumen de Postgres (con las tablas dentro). `synchronize: true` solo corre al arrancar la app, así que hubo que reiniciar el servidor para que TypeORM recreara las tablas.
- **Cascada de fallos en la primera ejecución de la colección.** El POST de género devolvía 500 por violar el índice único; el check `pm.test` fallaba antes de que se ejecutara el `pm.collectionVariables.set`, así que la variable quedaba vacía y todos los requests siguientes fallaban con `+0` o 404. Fix: mover el `set` de la variable antes de los `pm.expect`, y usar `{{$randomInt}}` en los nombres.
- **La colección se contradecía entre carpetas.** La carpeta Géneros borraba su género al final, y la carpeta Bandas después intentaba crear bandas con ese género ya borrado → 400 en cascada. Fix: un género auxiliar. Géneros crea dos (uno para sus tests, que borra; otro que queda vivo) y cada carpeta usa su propia variable (`{{generoId}}` y `{{generoIdBandas}}`).

**Resultado final: 32/32 verificaciones pasando.**

---

## Estado al cerrar la Entrega 1

**Requisitos de la consigna:**

| Requisito | Estado |
|---|---|
| Dos entidades con relación 1 a N | OK — Género → Banda |
| CRUD completo | OK — ambos recursos |
| Filtrar listado por un campo | OK — `?generoId=` |
| Persistencia relacional con TypeORM + env vars | OK — PostgreSQL + Docker |
| Validaciones y códigos HTTP correctos | OK — `ValidationPipe` global |
| Colección de Postman subida al repo | OK — 22 requests / 32 verificaciones |
| Historial de sesiones / decisiones | OK — este archivo |

**Commits:** 4 commits de desarrollo + este historial, uno por paso.

### Commits

```
ff954c5  test: colección Postman con casos de éxito y error
5a57b29  feat: ValidationPipe global y filtrado de bandas por género
4e233d8  feat: CRUD Bandas con relación ManyToOne a Género
ca93c07  feat: CRUD Géneros (entity, DTOs, service, controller, TypeORM)
```

### Limpieza final de la base de datos

Después de las pruebas, la base había quedado con registros de prueba acumulados (géneros con sufijo numérico de las corridas de la colección, bandas duplicadas). Se limpió para dejar datos de ejemplo consistentes:

```bash
docker-compose down -v    # borra el volumen: se van tablas y datos
docker-compose up -d      # Postgres vacío
npm run start:dev         # synchronize:true recrea las tablas
```

Luego se cargaron datos de ejemplo por HTTP:

| Género | Banda |
|---|---|
| Rock | The Beatles (Reino Unido, 1960) |
| Metal | Ghost (Suecia, 2006) |
| Pop | The Jacksons (Estados Unidos, 1964) |

**Nota:** esta limpieza no modificó ningún archivo del repo, así que no generó commit. Solo afectó al volumen de Docker en la máquina local.

**Pendiente:** Entrega 2 — Frontend Angular + deploy (Render para backend, Netlify para frontend), en un repo de GitHub separado.
