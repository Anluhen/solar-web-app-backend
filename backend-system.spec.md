# Backend System Specification

## Overview
The backend is a NestJS 10 application that exposes RESTful endpoints for managing `Envios`, `Materiais`, `Projetos`, demo `Items`, staff records, and health checks. It runs on port `3001` by default (`backend/src/main.ts`) and automatically registers Swagger docs at `/api`. Persistence is provided by PostgreSQL via TypeORM with entities mapped per feature module.

## Architecture
- NestJS modular structure (`backend/src/app.module.ts`) composes feature modules: `Envios`, `Materiais`, `Projetos`, `Items`, `Staff`, `Postgres`, `Configuration`, `Mail`, and `Health`.
- `ConfigurationModule` loads environment variables from `config/.env` using `@nestjs/config` (`backend/src/modules/configuration/configuration.module.ts`).
- `PostgresModule` configures the `postgreConnection` TypeORM connection (`backend/src/modules/postgres/postgres.module.ts`) with `synchronize: true` for schema sync in development.
- Each domain module declares controllers, DTOs, services, and entities. Abstract service interfaces provide injection tokens so implementations can be swapped.

## Database Migrations
- `20240101000000-initial-schema` — creates base tables (envios, materiais, staff).
- `20250925164631-add-ufv-to-envios` — adds the `ufv` column plus index.
- `20251002120000-allow-separacao-status` — rebuilds the status CHECK constraint to include `SEPARACAO`.
- `20260226120000-create-projetos` — creates `projetos`, `projeto_peps`, `projeto_items` tables.
- `20260301000000-add-entregue-status` — adds `ENTREGUE` to the envio status CHECK constraint.
- `20260301120000-add-pep-nome` — adds `nome` column to `projeto_peps`.
- `20260302000000-add-envio-status-dates` — adds `data_enviado`, `data_entregue` date columns to `envios`.
- `20260302120000-add-previsao-chegada` — adds `previsao_chegada` date column to `envios`.
- `20260303000000-add-projeto-item-grupo` — adds `grupo` column to `projeto_items`.
- `20260309120000-AddProjetoMetadata` — adds Solar and Acionamentos/Sistemas metadata fields to `projetos`.
- `20260312120000-add-pep-solar-fields` — adds `zrgp`, `data_preparacao`, `ml`, `is_cpc` to `projeto_peps`.

**Migration Strategy**
The CI/CD pipeline (`.gitlab-ci.yml`) executes migrations in two phases to handle both fresh and existing databases:
1. `npm run typeorm -- migration:run --fake-only` marks all discovered migrations as completed without executing them. On fresh databases, this is a no-op; on databases with existing schema (copied from another environment), this prevents re-creation attempts.
2. `npm run migration:run` executes any pending migrations (those not yet marked complete).

This two-phase approach safely handles both fresh deployments and cloned databases without manual intervention.

## API Endpoints

### Envios (`/envios`)
| Method & Path | Description | Sample Request | Sample Response |
| --- | --- | --- | --- |
| `POST /envios` | Create a new envio | `{ "pep": "PEP-123", "zvgp": "ZV-987", "gerador": "Gerador Norte", "ufv": "UFV Norte", "separacao": "2024-06-15" }` | Created envio with `id`, `status: "RASCUNHO"`, timestamps |
| `GET /envios?id=&pep=&zvgp=&gerador=&ufv=&status=` | List envios with optional filters (including `status`) | `GET /envios?pep=PEP-&status=SEPARACAO` | Array of envio objects |
| `GET /envios/:id` | Retrieve a single envio | `GET /envios/42` | Single envio object |
| `PUT /envios/:id` | Update an envio | `{ "zvgp": "ZV-765", "observacoes": "updated" }` | Updated envio object |
| `DELETE /envios/:id` | Remove an envio | `DELETE /envios/42` | Deleted envio object |
| `GET /envios/:id/materiais` | List materiais for an envio | `GET /envios/42/materiais` | Array of material objects |
| `GET /envios/status?status=` | Get status rule (defaults to `RASCUNHO`) | `GET /envios/status` | StatusRule object |
| `GET /envios/:id/status` | Get status rule for an envio's current status | `GET /envios/42/status` | StatusRule object |
| `PUT /envios/:id/status` | Advance to the next status; triggers notification email at SEPARACAO | `{ "observacoes": "Pronto" }` | Updated envio object |

**Status flow**

`RASCUNHO` → `SEPARACAO` → `ENVIADO` → `ENTREGUE` (terminal)

`SEPARACAO` → `CANCELADO` → `RASCUNHO` (cancellation path)

**StatusRule shape**
```json
{
  "id": "RASCUNHO",
  "name": "Rascunho",
  "required": ["ufv", "pep", "zvgp", "gerador", "separacao"],
  "editable": ["ufv", "pep", "zvgp", "gerador", "separacao", "observacoes", "materiaisTable"],
  "next": "SEPARACAO"
}
```

**Envio fields**
| Field | Type | Notes |
| --- | --- | --- |
| `id` | string (bigint) | Auto-generated |
| `pep` | string | Indexed |
| `zvgp` | string | Indexed |
| `gerador` | string | Indexed |
| `ufv` | string | Indexed |
| `status` | enum | RASCUNHO / SEPARACAO / ENVIADO / ENTREGUE / CANCELADO |
| `separacao` | date (YYYY-MM-DD) | Planned separation date |
| `data_enviado` | date \| null | Date shipment was dispatched |
| `data_entregue` | date \| null | Date delivery was confirmed |
| `previsao_chegada` | date \| null | Estimated arrival date |
| `observacoes` | string \| null | Free-text notes |

**Error responses**
- `400 Bad Request`: DTO validation failures (missing required fields, invalid status).
- `404 Not Found`: Non-existent envio id.

---

### Materiais (`/materiais`)
| Method & Path | Description |
| --- | --- |
| `POST /materiais` | Create material linked to an envio (`envio_id`, `sap`, `descricao`, `quantidade`) |
| `GET /materiais` | List all materiais |
| `GET /materiais/:id?withEnvio=true` | Fetch single material, optionally eager-loading envio |
| `PUT /materiais/:id` | Update a material |
| `DELETE /materiais/:id` | Delete a material |

**Error responses**
- `400`: Missing `envio_id` on create, `envio_id: null` on update, invalid quantities.
- `404`: Non-existent `envio_id` or material not found.

---

### Projetos (`/projetos`)
| Method & Path | Description |
| --- | --- |
| `POST /projetos` | Create project — checks `pep_prefix` uniqueness (`409` on duplicate) |
| `GET /projetos?nome=&pep_prefix=&pm=&analista=&secao=` | List projects with delivery stats; optionally filter by `secao` (Solar / Acionamentos/Sistemas) |
| `GET /projetos/pep-lookup?prefix=` | Find PEP suffixes from existing Envios + ProjetoPeps |
| `GET /projetos/pep-items?pep=` | Enriched delivery items for a full PEP string |
| `POST /projetos/import-from-envios` | Bulk-create projects from existing Envios without a matching Projeto |
| `GET /projetos/:id` | Get project with its PEPs |
| `PUT /projetos/:id` | Update project metadata |
| `GET /projetos/:id/summary` | Project with PEPs and per-item delivery quantities (`ProjetoSummary`) |
| `GET /projetos/:id/aggregate` | Aggregate delivery table — one row per SAP across all PEPs (`AggregateRow[]`) |
| `GET /projetos/:id/envios` | All envios linked to this project's PEPs |
| `POST /projetos/:id/peps` | Add a PEP to the project |
| `PUT /projetos/:id/peps/:pepId` | Update PEP metadata |
| `DELETE /projetos/:id/peps/:pepId` | Remove a PEP (cascades items) |
| `POST /projetos/:id/peps/:pepId/items/bulk` | Replace all items for a PEP |
| `PUT /projetos/:id/peps/:pepId/items/:itemId` | Update a single item |

**`ProjetoWithStats` response shape** (from `GET /projetos`):
```json
{
  "id": "1",
  "nome": "UFV Exemplo",
  "pep_prefix": "WBS-001",
  "pm": "João",
  "secao": "Solar",
  "total_necessaria": 100,
  "total_separado": 20,
  "total_enviado": 60,
  "total_entregue": 60,
  "pct_entregue": 60,
  "peps": [
    { "id": "5", "pep_suffix": "-001", "pct_entregue": 60 }
  ]
}
```

**Delivery quantity computation**
- `quantidade_separado` — sum of quantities in SEPARACAO-status envios for this PEP+SAP
- `quantidade_enviado` — sum in ENVIADO-status envios
- `quantidade_entregue` — sum in ENTREGUE-status envios + `quantidade_entregue_manual` (for `already_started` projects)
- `saldo` = `quantidade_necessaria` − `quantidade_entregue`
- `is_virtual = true` when the SAP has no ProjetoItem record (only envio materials)
- CANCELADO envios are excluded from all computations

**Entities**

`Projeto` — top-level project:
- Core: `nome`, `pep_prefix` (unique, indexed), `pm`, `secao`, `cliente`, `produto`, `already_started`
- Solar-only: `zvgp_projeto`, `zrgp`, `data_preparacao`, `pep_faturavel`, `cns_ano`, `ml`, `is_cpc`, `is_cpc47`, `claim`, `data_claim`, `observacoes_chefe`, `data_criacao_pep`, `idioma`, `empresa`, `contatos_cliente`, `contatos_weg`
- `analista` — nullable, legacy only (not shown on form)

`ProjetoPep` — BOM list within a project:
- `pep_suffix`, `nome` (optional label), `zvgp` (indexed), `zrgp`, `gerador` (indexed)
- Solar per-PEP: `data_preparacao`, `ml`, `is_cpc`

`ProjetoItem` — line item within a PEP:
- `sap`, `descricao`, `quantidade_necessaria`, `quantidade_entregue_manual`, `grupo`

---

### Items Demo (`/api/items`)
In-memory CRUD — `POST`, `GET /:id`, `PUT /:id`, `DELETE /:id`.

### Staff (`/api/postgres/staff`)
PostgreSQL CRUD — `POST`, `GET /:id`, `PUT /:id`, `DELETE /:id`.

### Health (`/health`)
- `GET /health/liveness` → `{ "status": "ok" }`
- `GET /health/readiness` → `{ "status": "ok" }`

---

## Detailed User Flows & Error States

### 1. Create envio and associated materiais
1. Client submits `POST /envios` with required fields (`pep`, `zvgp`, `gerador`, `ufv`, `separacao`).
2. Backend validates DTO; missing fields trigger `400` with validation messages.
3. On success, envio is saved with `status: RASCUNHO` and returned with `id` and timestamps.
4. Client optionally calls `POST /materiais` per item with `envio_id` from step 3.
5. If `envio_id` is invalid, material creation returns `404`.
6. Removing an envio cascades delete to materiais (`onDelete: CASCADE`).

### 2. Advance envio status
1. Client sends `PUT /envios/:id/status`; service applies the rule's `next` status.
2. At SEPARACAO: notification email is sent to configured recipients (prod vs dev recipients differ).
3. If mail fails, the API responds `500` and the envio remains in its previous status.
4. ENTREGUE is a terminal state — no further `next` transition exists.
5. CANCELADO → RASCUNHO allows re-opening a cancelled envio.

### 3. Create project and track deliveries
1. Client `POST /projetos` with `pep_prefix` (must be unique), `nome`, `pm`, `secao`, and optional metadata.
2. Add PEPs via `POST /projetos/:id/peps`; each PEP gets a `pep_suffix`.
3. Add items via `POST /projetos/:id/peps/:pepId/items/bulk` (paste-from-Excel flow on frontend).
4. `GET /projetos/:id/summary` computes delivery quantities by joining against ENVIOS in real time.
5. `GET /projetos/:id/aggregate` merges all PEPs into a single SAP-level view for progress overview.

### 4. Import projects from existing envios
1. `POST /projetos/import-from-envios` scans all envios and groups them by `pep` prefix.
2. For each group without an existing `Projeto`, a new `Projeto` + `ProjetoPep` records are created.
3. Returns the list of newly created projects.

---

## Integration Points in Code
- **App bootstrap**: `backend/src/main.ts` — Swagger + CORS.
- **Module composition**: `backend/src/app.module.ts`.
- **Envios**: `modules/envios/controllers/envios.controller.ts`, `services/envios.service.ts`, `dtos/envio-form.dto.ts`, `entities/envio.entity.ts`, `rules/status.rules.ts`
- **Materiais**: `modules/materiais/controllers/materiais.controller.ts`, `services/materiais.service.ts`, `entities/material.entity.ts`
- **Projetos**: `modules/projetos/controllers/projetos.controller.ts`, `services/projetos.service.ts`, `interfaces/projetos.service.interface.ts`, `entities/projeto.entity.ts`, `entities/projeto-pep.entity.ts`, `entities/projeto-item.entity.ts`
- **Database config**: `modules/postgres/postgres.module.ts`, `utils/env_variable_names.ts`
- **Mail**: `modules/mail/mail.service.ts`

---

## Configuration & Environment
| Variable | Purpose |
| --- | --- |
| `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USERNAME`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE` | Database connection for TypeORM. |
| `SWAGGER_SERVERS_LIST` | Optional CSV list of servers added to Swagger document. |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_AUTH` | SMTP credentials consumed by `MailService`. |
| `NODE_ENV` | Controls notification recipients (`production` → real addresses; other → dev addresses). |

## Operational Considerations
- TypeORM `synchronize: true` is suitable for development; production uses migrations exclusively.
- Entities map bigint columns to strings in TypeScript to avoid precision loss.
- Swagger UI at `/api`; JSON at `/api/json`.
- Migration scripts: `npm run migration:run`, `npm run migration:generate -- <Name>`.
- `pep-lookup` searches both existing Envios and `projeto_peps` so projects with items but no envios still appear in the autocomplete.
