# Backend System Specification

## Overview
The backend is a NestJS 10 application that exposes RESTful endpoints for managing `Envios`, `Materiais`, demo `Items`, staff records, and health checks. It runs on port `3001` by default (`backend/src/main.ts`) and automatically registers Swagger docs at `/api`. Persistence is provided by PostgreSQL via TypeORM with entities mapped per feature module.

## Architecture
- NestJS modular structure (`backend/src/app.module.ts`) composes feature modules: `Envios`, `Materiais`, `Items`, `Staff`, `Postgres`, `Configuration`, `Mail`, and `Health`.
- `ConfigurationModule` loads environment variables from `config/.env` using `@nestjs/config` (`backend/src/modules/configuration/configuration.module.ts`).
- `PostgresModule` configures the `postgreConnection` TypeORM connection (`backend/src/modules/postgres/postgres.module.ts`) with `synchronize: true` for schema sync in development.
- Each domain module declares controllers, DTOs, services, and entities. Abstract service interfaces provide injection tokens so implementations can be swapped.

## API Endpoints
### Envios (`/envios`)
| Method & Path | Description | Sample Request | Sample Response |
| --- | --- | --- | --- |
| `POST /envios` | Create a new envio (`EnviosController.postEnvio`) | ```json
{
  "pep": "PEP-123",
  "zvgp": "ZV-987",
  "gerador": "Gerador Norte",
  "ufv": "UFV Norte",
  "separacao": "2024-06-15",
  "observacoes": "Prioridade alta"
}
``` | ```json
{
  "id": "42",
  "pep": "PEP-123",
  "zvgp": "ZV-987",
  "gerador": "Gerador Norte",
  "ufv": "UFV Norte",
  "separacao": "2024-06-15",
  "observacoes": "Prioridade alta",
  "status": "RASCUNHO",
  "created_at": "2024-06-10T18:05:21.123Z",
  "updated_at": "2024-06-10T18:05:21.123Z"
}
``` |
| `GET /envios?id=&pep=&zvgp=&gerador=&ufv=` | List envios filtered by optional query params (`EnviosService.getEnvios`) | `GET /envios?pep=PEP-&ufv=UFV` | ```json
[
  {
    "id": "42",
    "pep": "PEP-123",
    "zvgp": "ZV-987",
    "gerador": "Gerador Norte",
    "ufv": "UFV Norte",
    "separacao": "2024-06-15",
    "observacoes": "Prioridade alta",
    "status": "RASCUNHO",
    "created_at": "2024-06-10T18:05:21.123Z",
    "updated_at": "2024-06-10T18:05:21.123Z"
  }
]
``` |
| `GET /envios/:id` | Retrieve a single envio by id. `withMateriais` query param is accepted but ignored server-side (`EnviosController.getEnvio`). | `GET /envios/42?withMateriais=true` | ```json
{
  "id": "42",
  "pep": "PEP-123",
  "zvgp": "ZV-987",
  "gerador": "Gerador Norte",
  "ufv": "UFV Norte",
  "separacao": "2024-06-15",
  "observacoes": "Prioridade alta",
  "status": "RASCUNHO",
  "created_at": "2024-06-10T18:05:21.123Z",
  "updated_at": "2024-06-11T11:02:44.789Z"
}
``` |
| `PUT /envios/:id` | Update an envio (`EnviosService.putEnvio`). | ```json
{
  "zvgp": "ZV-765",
  "gerador": "Gerador Norte",
  "pep": "PEP-123",
  "ufv": "UFV Leste",
  "observacoes": "Cliente atualizou endereço"
}
``` | ```json
{
  "id": "42",
  "pep": "PEP-123",
  "zvgp": "ZV-765",
  "gerador": "Gerador Norte",
  "ufv": "UFV Leste",
  "separacao": "2024-06-15",
  "observacoes": "Cliente atualizou endereço",
  "status": "RASCUNHO",
  "created_at": "2024-06-10T18:05:21.123Z",
  "updated_at": "2024-06-12T09:44:02.001Z"
}
``` |
| `DELETE /envios/:id` | Remove an envio (`EnviosService.deleteEnvio`). | `DELETE /envios/42` | ```json
{
  "id": "42",
  "pep": "PEP-123",
  "zvgp": "ZV-987",
  "gerador": "Gerador Norte",
  "ufv": "UFV Norte",
  "separacao": "2024-06-15",
  "observacoes": "Prioridade alta",
  "status": "RASCUNHO",
  "created_at": "2024-06-10T18:05:21.123Z",
  "updated_at": "2024-06-10T18:05:21.123Z"
}
``` |
| `GET /envios/:id/materiais` | List materiais for an envio (`MateriaisService.getMateriaisByEnvio`). | `GET /envios/42/materiais` | ```json
[
  {
    "id": "7",
    "envio_id": "42",
    "sap": "900000123",
    "descricao": "Painel Solar 300W",
    "quantidade": 10,
    "created_at": "2024-06-10T19:01:44.512Z",
    "updated_at": "2024-06-10T19:01:44.512Z"
  }
]
``` |
| `GET /envios/status?status=` | Retrieve the status rule for a given status (defaults to `RASCUNHO` when omitted). | `GET /envios/status` | ```json
{
  "id": "RASCUNHO",
  "name": "Rascunho",
  "required": ["ufv", "pep", "zvgp", "gerador", "separacao"],
  "editable": ["ufv", "pep", "zvgp", "gerador", "separacao", "observacoes", "materiaisTable"],
  "next": "ENVIADO"
}
``` |
| `GET /envios/:id/status` | Return the rule associated with the envio's persisted status. | `GET /envios/42/status` | ```json
{
  "id": "RASCUNHO",
  "name": "Rascunho",
  "required": ["ufv", "pep", "zvgp", "gerador", "separacao"],
  "editable": ["ufv", "pep", "zvgp", "gerador", "separacao", "observacoes", "materiaisTable"],
  "next": "ENVIADO"
}
``` |
| `PUT /envios/:id/status` | Advance the envio to the next status defined by `StatusRulesService`. Body mirrors `EnvioFormDto` for validation and may include comments. | ```json
{
  "observacoes": "Pronto para envio"
}
``` | ```json
{
  "id": "42",
  "pep": "PEP-123",
  "zvgp": "ZV-987",
  "gerador": "Gerador Norte",
  "ufv": "UFV Norte",
  "separacao": "2024-06-15",
  "observacoes": "Pronto para envio",
  "status": "ENVIADO",
  "created_at": "2024-06-10T18:05:21.123Z",
  "updated_at": "2024-06-12T09:44:02.001Z"
}
``` |

**Error responses**
- `400 Bad Request`: DTO validation failures, e.g. missing `pep`/`ufv` in create (`EnvioFormDto`).
- `404 Not Found`: Non-existent envio id on `GET/PUT/DELETE` (`EnviosService`).
- `409` conflicts not currently emitted; duplicates rely on upstream constraints.

### Materiais (`/materiais`)
| Method & Path | Description | Sample Request | Sample Response |
| --- | --- | --- | --- |
| `POST /materiais` | Create material linked to an envio (`MateriaisService.postMaterial`). | ```json
{
  "envio_id": "42",
  "sap": "900000123",
  "descricao": "Painel Solar 300W",
  "quantidade": 10
}
``` | ```json
{
  "id": "7",
  "envio_id": "42",
  "sap": "900000123",
  "descricao": "Painel Solar 300W",
  "quantidade": 10,
  "created_at": "2024-06-10T19:01:44.512Z",
  "updated_at": "2024-06-10T19:01:44.512Z"
}
``` |
| `GET /materiais` | List all materiais (`MateriaisService.getMateriais`). | `GET /materiais` | ```json
[
  {
    "id": "7",
    "envio_id": "42",
    "sap": "900000123",
    "descricao": "Painel Solar 300W",
    "quantidade": 10,
    "created_at": "2024-06-10T19:01:44.512Z",
    "updated_at": "2024-06-10T19:01:44.512Z"
  }
]
``` |
| `GET /materiais/:id?withEnvio=true` | Fetch single material, optionally eager-loading envio. | `GET /materiais/7?withEnvio=true` | ```json
{
  "id": "7",
  "envio_id": "42",
  "sap": "900000123",
  "descricao": "Painel Solar 300W",
  "quantidade": 10,
  "created_at": "2024-06-10T19:01:44.512Z",
  "updated_at": "2024-06-10T19:01:44.512Z",
  "envio": {
    "id": "42",
    "pep": "PEP-123",
    "ufv": "UFV Norte",
    "status": "RASCUNHO"
  }
}
``` |
| `PUT /materiais/:id` | Update a material (`MateriaisService.putMaterial`). | ```json
{
  "descricao": "Painel Solar 350W",
  "quantidade": 12
}
``` | ```json
{
  "id": "7",
  "envio_id": "42",
  "sap": "900000123",
  "descricao": "Painel Solar 350W",
  "quantidade": 12,
  "created_at": "2024-06-10T19:01:44.512Z",
  "updated_at": "2024-06-12T08:22:19.308Z"
}
``` |
| `DELETE /materiais/:id` | Delete a material (`MateriaisService.deleteMaterial`). | `DELETE /materiais/7` | ```json
{
  "deleted": true,
  "id": "7"
}
``` |

**Error responses**
- `400 Bad Request`: Missing `envio_id` on create, `envio_id` set to `null`, invalid quantities.
- `404 Not Found`: Non-existent `envio_id` on create/update; material not found on `GET/PUT/DELETE`.

### Items Demo (`/api/items`)
| Method | Description |
| --- | --- |
| `POST /api/items` | Create in-memory item (`ItemsService.postItem`). |
| `PUT /api/items/:id` | Update item by numeric id. |
| `GET /api/items/:id` | Retrieve item. |
| `DELETE /api/items/:id` | Delete item. |

Sample request:
```json
{
  "name": "Item demo",
  "description": "Example payload"
}
```

### Staff (`/api/postgres/staff`)
| Method | Description |
| --- | --- |
| `POST /api/postgres/staff` | Create staff record in PostgreSQL. |
| `PUT /api/postgres/staff/:id` | Update record by numeric id. |
| `GET /api/postgres/staff/:id` | Fetch record. |
| `DELETE /api/postgres/staff/:id` | Remove record. |

### Health (`/health`)
- `GET /health/liveness` → `{ "status": "ok" }`
- `GET /health/readiness` → `{ "status": "ok" }`

## Detailed User Flows & Error States
### 1. Create envio and associated materiais
1. Client submits `POST /envios` with required fields (`pep`, `zvgp`, `gerador`, `separacao`).
2. Backend validates DTO (`EnvioFormDto`); missing fields trigger `400` with validation messages.
3. On success, envio row is saved and returned with generated `id` and timestamps.
4. Client optionally calls `POST /materiais` per item with `envio_id` from step 3.
5. If `envio_id` is invalid, material creation returns `404`.
6. When envio is accessed later (`GET /envios/:id/materiais`), related materiais cascade delete if envio removed (`ManyToOne` cascade in `MaterialEntity`).

### 2. Update envio status
1. Client sends `PUT /envios/:id` with new `status` and/or fields.
2. Service preloads entity; unknown id returns `404`.
3. Invalid `status` value fails DTO enum validation with `400`.
4. Successful update returns latest entity, enabling optimistic UI updates.

### 3. Material reassignment
1. Client uses `PUT /materiais/:id` with new `envio_id` when moving material.
2. Service fetches existing material with relation.
3. If payload omits `envio_id`, relation remains unchanged.
4. If `envio_id` is provided but not found, backend throws `404`.
5. Passing explicit `envio_id: null` yields `400` (`envio_id cannot be null`).

### 4. Staff CRUD (admin tooling)
1. Internal tooling uses `/api/postgres/staff` endpoints to manage staff records.
2. Numeric ids are enforced via `ParseIntPipe`; invalid numeric strings result in `400`.
3. Missing staff returns `404`; response bodies echo the deleted entity for audit purposes.

### 5. Service health monitoring
1. Probes hit `/health/liveness` & `/health/readiness`.
2. Any unexpected server errors return non-200, signaling orchestrator restarts.

## Integration Points in Code
- **App bootstrap**: `backend/src/main.ts` configures Swagger and CORS.
- **Module composition**: `backend/src/app.module.ts` imports feature modules.
- **Envios**:
  - Controller: `backend/src/modules/envios/controllers/envios.controller.ts`
  - Service implementation: `backend/src/modules/envios/services/envios.service.ts`
  - DTO: `backend/src/modules/envios/dtos/envio-form.dto.ts`
  - Entity: `backend/src/modules/envios/entities/envio.entity.ts`
- **Materiais**:
  - Controller: `backend/src/modules/materiais/controllers/materiais.controller.ts`
  - Service: `backend/src/modules/materiais/services/materiais.service.ts`
  - DTO: `backend/src/modules/materiais/dtos/material-form.dto.ts`
  - Entity: `backend/src/modules/materiais/entities/material.entity.ts`
- **Staff**: `backend/src/modules/staff/controllers/staff.controller.ts`, `backend/src/modules/staff/services/staff.service.ts`
- **Items demo**: `backend/src/modules/items/controllers/items.controller.ts`
- **Database config**: `backend/src/modules/postgres/postgres.module.ts`, env keys in `backend/src/utils/env_variable_names.ts`
- **Configuration**: `backend/src/modules/configuration/configuration.module.ts`
- **Mail**: `backend/src/modules/mail/mail.module.ts`, `backend/src/modules/mail/services/mail.service.ts`

## Configuration & Environment
| Variable | Purpose |
| --- | --- |
| `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USERNAME`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE` | Database connection for TypeORM. |
| `SWAGGER_SERVERS_LIST` | Optional CSV list of servers added to Swagger document. |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_AUTH` | SMTP credentials consumed by `MailService`. Missing values prevent the Nodemailer transporter from being created. |
| Auth-related variables (e.g. `OPENID_WELL_KNOWN_URL`, `ISSUER`, `AUDIENCE`) | Reserved for future OpenID integrations via `ENV_VARIABLE_NAMES`. |

## Operational Considerations
- TypeORM `synchronize: true` is suitable for development but should be disabled in production in favor of migrations.
- Entities map bigint columns to strings in TypeScript to avoid precision loss; consumers must treat ids as strings.
- Removing an envio cascades delete to materiais because of `onDelete: 'CASCADE'` in `MaterialEntity`.
- Swagger UI is served at `/api` with JSON document available at `/api/json` for tooling integration.
- NPM scripts `npm run typeorm`, `npm run migration:run`, and `npm run migration:generate -- <Name>` wrap the TypeORM CLI with the project datasource to simplify local migration workflows.
