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
| Log de la sesión con opencode | OK — `LOG-SESION-OPENCODE.json` |

**Commits:** 4 commits de desarrollo + 2 de documentación (este historial y el log de opencode).

### Commits

```
19edac2  docs: log de la sesion con opencode
632d943  docs: historial de sesiones y decisiones de la Entrega 1
ff954c5  test: colección Postman con casos de éxito y error
5a57b29  feat: ValidationPipe global y filtrado de bandas por género
4e233d8  feat: CRUD Bandas con relación ManyToOne a Género
ca93c07  feat: CRUD Géneros (entity, DTOs, service, controller, TypeORM)
```

Cada uno es una unidad que funciona por sí sola: los dos de documentación cierran la entrega (decisiones tomadas y log completo de la sesión con la IA).

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

---

## Entrega 2 — Frontend (Angular) + Deploy

**Repo:** https://github.com/germancondinanzo/tp-tecweb-frontend

**Deploys:**

| Parte | URL |
|---|---|
| Frontend (Netlify) | https://courageous-dango-2e1b41.netlify.app |
| Backend (Render) | https://tp-tecweb-backend.onrender.com |

### Arquitectura del frontend

Angular 20 con **NgModules** (el estándar que usa la cátedra), Bootstrap 5 y formularios
**template-driven** (`[(ngModel)]` + `FormsModule`).

```
src/app/
  app-module.ts            ← declara App, Generos y Bandas; provee HttpClient
  app-routing-module.ts    ← '' → /bandas, /generos, /bandas, ** → /bandas
  app.ts / app.html        ← navbar + <router-outlet>
  generos/                 ← CRUD de géneros (tabla + alta y edición en línea)
  bandas/                  ← CRUD de bandas (tabla + formulario con <select> de género)
  services/                ← GenerosService y BandasService (HttpClient)
  models/                  ← interfaces Genero, Banda, BandaPayload
src/environments/
  environment.ts              ← producción: https://tp-tecweb-backend.onrender.com
  environment.development.ts  ← desarrollo: http://localhost:3000
```

La configuración `development` de `angular.json` hace el `fileReplacements` de
`environment.ts` por `environment.development.ts`: así `npm start` apunta al backend local y
`npm run build` al de Render, sin tocar los servicios.

### Cómo se armó

1. **Base del proyecto** — `ng new` con NgModules, routing y SCSS. Se mantuvo NgModules (no
   standalone) para seguir el material de la cátedra.
2. **Modelo y servicios** — interfaces `Genero`/`Banda`/`BandaPayload` y un servicio por entidad
   (`getAll`, `create`, `update`, `remove`; en Bandas además `getOne` y el filtro `?generoId=`).
   La URL base sale de `environment`, no está escrita a mano en cada servicio.
3. **Géneros** — listado en tabla, alta con formulario template-driven, edición en línea y
   borrado con confirmación.
4. **Bandas con la relación 1 a N** — el listado muestra el género como badge
   (`banda.genero.nombre`, que llega anidado desde el backend) y el formulario tiene un
   `<select>` que carga los géneros con `[ngValue]="genero.id"`. Al editar, el select queda
   preseleccionado porque se bindea por **id**, no por objeto.
5. **Layout** — Bootstrap cargado desde `angular.json`, navbar responsive y tablas
   `table-responsive` para que se vean bien en el celular.
6. **Errores y validación** — se muestra al usuario un `alert` con el mensaje del backend
   (incluido el caso en que `class-validator` devuelve `message` como **array**) y un estado de
   carga con spinner mientras responde la API.

### Deploy

**Backend en Render** (servicio web + PostgreSQL):
- Build `npm install && npm run build`; start `npm run start:prod` (`node dist/main`).
- Variables de `.env.example` cargadas en el panel; base por **Internal Database URL**.
- La app escucha en `process.env.PORT`; `app.enableCors()` para que el sitio de Netlify pueda
  consumir la API.
- Se cargaron datos de ejemplo vía la API para que el docente vea las listas con contenido
  (4 géneros / 8 bandas).

**Frontend en Netlify** (conectado al repo, deploy automático desde `main`):
- Build `npm run build`; publish `dist/tp-tecweb-frontend` (salida aplanada en `angular.json`,
  sin subcarpeta `browser`).
- `netlify.toml` + `public/_redirects` con `/* /index.html 200`, para que refrescar en
  `/generos` o `/bandas` no devuelva 404.

### Errores resueltos durante la Entrega 2

1. **Templates con errores de compilación.** Los templates originales usaban construcciones que
   el chequeo estricto de Angular no aceptaba; se reescribieron más simples (`*ngIf` /
   `*ngFor`), manteniendo el comportamiento.
2. **El build de producción apuntaba a `localhost`.** `environment.ts` tenía la URL de
   desarrollo. Fix: `apiUrl` de producción a Render (`2443c8d`), sin tocar los servicios.
3. **El `publish` de Netlify no coincidía con la salida del build** (`dist/.../browser` vs
   `dist/...`). Fix: aplanar `outputPath` en `angular.json` y alinear `publish` en
   `netlify.toml` (`894011e`).
4. **404 al refrescar rutas internas.** Es el comportamiento normal de una SPA en un servidor
   estático. Fix: `_redirects` y el redirect de Netlify (`8aa0ced`, `f8f1ff3`).
5. **Al crear una banda no se guardaba la relación con el género.** Se corrigió asignando la
   entidad `genero` además del `generoId` en `bandas.service.ts` (`d40c6f5`).
6. **El navegador bloqueaba las llamadas por CORS.** Fix: `app.enableCors()` en el backend
   (`4d0eb74`).
7. **Mensajes de error poco útiles.** El backend pasó a devolver 409 al repetir un género y 400
   con mensaje cuando el género no existe (`08e6368`), y el front los muestra en pantalla.
8. **Deploy bloqueado en Netlify.** El sitio original quedó **pausado por créditos agotados**
   del plan gratuito: los deploys de producción no se ejecutaban y se seguía sirviendo un
   bundle viejo con `apiUrl: ""`. Se publicó un respaldo temporal en GitHub Pages para no
   quedar sin URL y, al crear un sitio nuevo, hubo que **desactivar la protección** del sitio
   (devolvía 401, y la consigna pide que se abra en incógnito).
9. **2 tests del componente Bandas fallaban** (`NG0201: No provider found for _HttpClient`)
   porque el `TestBed` no tenía `provideHttpClient()`. Fix en `bandas.spec.ts` (`a64ba15`).
10. **Los tests e2e del backend no arrancaban**: Jest cargaba con `require` paquetes ESM de Nest
    (`@nestjs/config`, `@nestjs/typeorm`). Fix: ejecutar Jest con `--experimental-vm-modules`
    (`fb2dadf`).
11. **Faltaba `.env.example`.** Se agregó con los nombres de todas las variables (`a24a9e2`).

### Verificación de la entrega

| Requisito (consigna Entrega 2) | Estado |
|---|---|
| CRUD completo desde la UI, mostrando las dos entidades y su relación | OK |
| Consume los endpoints de la Entrega 1 vía servicios de Angular | OK |
| Manejo de errores y mensajes al usuario | OK — alerta con el mensaje del backend |
| Validación de formularios | OK — `required` en el front + validaciones del DTO en el back |
| Build de producción sin `localhost` | OK |
| Backend deployado en Render, responde con datos | OK |
| Postman funciona contra Render cambiando solo `baseUrl` | OK |
| Frontend deployado en Netlify (incógnito, deep-link sin 404) | OK |
| README del front con las URLs y el del back con la de Render | OK |
| Historial de la sesión | OK — este archivo |

**Pruebas sobre el sitio publicado:** carga de 4 géneros y 8 bandas desde Render, cero errores
de consola, refresco en `/generos` y `/bandas` sin 404, y un 409 provocado a propósito (género
duplicado) que se muestra como alerta sin romper la pantalla ni duplicar la tabla.

### Commits del frontend

```
2652cb2  chore: proyecto Angular 20 con NgModules, routing y SCSS
3a8d86c  feat: interfaces Genero y Banda del modelo
78e74cf  feat: environments y GenerosService con HttpClient
cf1fb48  feat: listado de generos consumiendo la API
3c985ab  feat: alta de generos con formulario template-driven
a9419a7  feat: edicion y borrado de generos
f317b50  feat: BandasService y tipo BandaPayload
99e294e  feat: listado de bandas con genero anidado
dd84330  feat: filtro de bandas por genero
3c0f525  feat: CRUD completo de bandas con select de genero
4ba9ea9  fix: ruta default y wildcard, titulo e idioma, tests de componentes
8aa0ced  chore: redirecciones de SPA para Netlify
81ed60a  chore: instalar Bootstrap y cargarlo desde angular.json
eebed54  feat: navbar responsive y estilos Bootstrap en tablas y formularios
e4338e9  feat: manejo de errores y validación en formularios
3f88add  feat: filtrado por país y ordenamiento por año
3051632  fix: filtros siempre visibles despues de cargar géneros
ec678fb  fix: filtros siempre visibles con 'Todos' por defecto
5e4a4ae  revert: quitar filtros y ordenamiento, dejar estado original
e580d49  docs: reemplazar README con documentación del TP
3751fd6  docs: README sin emojis, documentación del TP
7952ead  fix: HTML templates simples sin errores TS
f8f1ff3  chore: add netlify.toml with correct config
894011e  fix: flatten angular output and set netlify publish to dist root
2443c8d  fix: set production apiUrl to Render backend
c640847  chore: trigger netlify redeploy
11b9f34  chore: borrar archivo temporal deploy-trigger.txt
0c1f51d  feat: mostrar errores del backend y estado de carga en la UI
a64ba15  fix(test): agregar provideHttpClient en el spec de Bandas (fallaban 2 tests)
29029da  style: corregir indentacion en el servicio de generos
1d073f7  docs: documentar deploys, corregir ruta de build y environments
```

Cada commit es una unidad que funciona por sí sola: primero el CRUD de Géneros, después el de
Bandas con la relación, luego el layout con Bootstrap, el manejo de errores y por último el
deploy y su documentación.

### Commits del backend durante la Entrega 2

```
8ee64fb  docs: agregar URLs de deploy, instrucciones de Render y seccion de tests
a24a9e2  docs: agregar .env.example y actualizar instrucciones de configuracion
fb2dadf  fix: manejar error de arranque y reparar script de tests e2e
a0d8635  chore: destrackear sesion IA y export Postman local, normalizar docker-compose
4beafdc  revert: quitar filtros pa y orden en bandas
e8ef4e2  feat: ordenar alfabéticamente géneros y bandas en findAll
08e6368  fix: errores 409 y 400 con mensaje en generos
d40c6f5  fix: asignar la relacion genero al crear banda
4d0eb74  feat: habilitar CORS para el frontend
7b6c2cd  docs: README propio del TP con endpoints y puesta en marcha
```

### Limitaciones y notas

- El backend usa el **plan gratuito de Render**, que duerme el servicio: la primera petición
  puede tardar ~40 s. Por eso la UI muestra el estado de carga.
- `synchronize: true` crea las tablas al arrancar (aceptable para el TP; en un proyecto real
  irían migraciones). Si la base gratuita de Render se recrea o vence, hay que volver a cargar
  los datos de ejemplo.
- La UI final no incluye filtros ni ordenamiento: se probaron y se revirtieron para no salir
  del alcance de la consigna. El filtro por género sigue disponible en la API
  (`GET /bandas?generoId=`) y está cubierto en la colección de Postman.
- El log completo de la sesión (`LOG-SESION-OPENCODE.json`) no se versiona por su tamaño
  (2.4 MB); se conserva aparte para la entrega.

