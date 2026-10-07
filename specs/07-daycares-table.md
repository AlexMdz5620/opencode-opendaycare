# SPEC 07 — Primera tabla `daycares` en Supabase vía migración MCP

> **Estado:** Approved
> **Depende de:** Ninguna
> **Fecha:** 2026-10-07
> **Objetivo:** Crear la tabla `public.daycares` en Supabase con una única migración aplicada por MCP que habilita RLS sin políticas e inserta 5 guarderías, siendo la principal la Guardería Sala Soles, y registrar la migración como archivo en `supabase/migrations/` del repo.

## Scope

**In:**

- Migración única vía MCP `apply_migration` (name: `create_daycares_table`) que hace las 3 cosas en un solo paso: `CREATE TABLE`, `ENABLE ROW LEVEL SECURITY` y 5 `INSERT`.
- Tabla `public.daycares` con `id uuid PK default gen_random_uuid()`, `name text not null`, `address text not null` (campo agregado respecto a la referencia `docs`) y `created_at timestamptz not null default now()`.
- Seed de 5 guarderías (tabla en Data model); la importante es `Guardería Sala Soles`.
- RLS habilitado **sin políticas**: la tabla queda cerrada al Data API / `anon` key.
- Verificación con `execute_sql`, `list_tables` y `get_advisors(security)`.
- Archivo de migración en el repo: `supabase/migrations/20261007184831_create_daycares_table.sql` con el mismo SQL aplicado (espejo de la migración remota, version `20261007184831` de `schema_migrations`).

**Out of scope (for future specs):**

- `supabase-js`, `@supabase/ssr` y variables de entorno (decisión del usuario).
- Supabase CLI (no está instalado; el archivo se crea a mano, no se ejecuta `supabase db push`).
- Políticas RLS (solo se habilita RLS; las políticas llegan con Auth/integración).
- El resto de tablas del esquema (`users`, `rooms`, `children`, `posts`, …).
- Cualquier cambio en el código de la app, los mocks o la UI.
- CRUD o visualización de guarderías.

## Data model

Migración remota única (nombre `create_daycares_table`):

```sql
create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;
```

Seed (5 filas, nombres y direcciones ficticios — se inventan en esta spec):

| name                            | address                          |
| ------------------------------- | -------------------------------- |
| Guardería Sala Soles            | Av. Los Leones 1450, Providencia |
| Guardería Pequeños Exploradores | Calle Mayor 12, Centro           |
| Guardería Nido Feliz            | Av. Primavera 845, Col. Jardines |
| Guardería Mundo Infantil        | Calle Robles 23, Barrio Norte    |
| Guardería Arcoíris              | Av. del Parque 670, Zona Sur     |

No hay cambios de datos en el repo: ninguna estructura TS existente se modifica. El único archivo nuevo es la migración SQL (ver Scope).

## Implementation plan

1. **Preparación.** Cargar las skills `supabase` y `supabase-postgres-best-practices` (regla de AGENTS.md) y confirmar con `list_tables` que `public` sigue vacío. _Prueba: `tables = []`._
2. **Migración.** Ejecutar `apply_migration` con name `create_daycares_table` y el SQL anterior (CREATE + RLS + 5 INSERT en un solo statement set). _Prueba: la tool reporta éxito sin error._
3. **Verificación de esquema.** `execute_sql` contra `information_schema.columns` y `pg_class`: 4 columnas, PK en `id` con default `gen_random_uuid()`, `name`/`address` `is_nullable = 'NO'`, `relrowsecurity = true`. _Prueba: los 5 datos coinciden con el Data model._
4. **Verificación de datos.** `execute_sql`: `count(*) = 5` y existe la fila `Guardería Sala Soles` con dirección no nula. _Prueba: 5 filas, Soles presente._
5. **Registro y advisors.** Confirmar la fila `create_daycares_table` en `supabase_migrations.schema_migrations` y correr `get_advisors(security)`. _Prueba: migración registrada; ningún hallazgo sobre `daycares` (el INFO `rls_enabled_no_policy` es intencional y no cuenta)._
6. **Archivo de migración en el repo.** Crear `supabase/migrations/20261007184831_create_daycares_table.sql` a mano con el mismo SQL de la migración remota. _Prueba: el archivo existe y su SQL coincide con lo aplicado._
7. **Repo.** `git status` muestra solo `specs/07-daycares-table.md` y el archivo de migración nuevo; `package.json` sin dependencias nuevas. _Prueba: sin deps nuevas; la app no se tocó._

## Acceptance criteria

- [x] `public.daycares` existe con `id uuid`, `name text`, `address text`, `created_at timestamptz`.
- [x] `id` es PRIMARY KEY con default `gen_random_uuid()`.
- [x] `name` y `address` tienen `is_nullable = 'NO'`.
- [x] `select count(*) from public.daycares` devuelve `5`.
- [x] Existe exactamente una fila con `name = 'Guardería Sala Soles'` y dirección no nula.
- [x] Las 5 filas tienen `name` y `address` no nulos.
- [x] `relrowsecurity` en `pg_class` para `daycares` es `true`.
- [x] `pg_policies` devuelve 0 políticas para `daycares` (tabla cerrada al anon key).
- [x] `supabase_migrations.schema_migrations` contiene `create_daycares_table`.
- [x] `get_advisors(security)` no reporta hallazgos sobre `daycares` (el INFO `rls_enabled_no_policy` es intencional).
- [x] Existe `supabase/migrations/20261007184831_create_daycares_table.sql` con el SQL de la migración remota (CREATE + RLS + 5 INSERT).
- [x] No se agregaron dependencias (`package.json` sin `supabase-js`) ni se instaló Supabase CLI.
- [x] `git status` no muestra cambios fuera de `specs/07-daycares-table.md` y `supabase/migrations/20261007184831_create_daycares_table.sql`.

## Decisions

- **Sí:** MCP `apply_migration` directo al proyecto remoto (`tffklxeenwscrphijyrx`) para ejecutar, **y** archivo espejo en `supabase/migrations/` para historial en el repo (enmienda del 2026-10-07 pedida por el usuario). **No:** Supabase CLI (no está instalado) ni `supabase db push`.
- **Sí:** una sola migración con CREATE + RLS + seed. **No:** migraciones separadas (decisión explícita del usuario: "una sola").
- **Sí:** `address text not null` además de los 3 campos de la referencia `docs`. **No:** limitarse al doc ni hacerlo nullable.
- **Sí:** RLS habilitado sin políticas (tabla cerrada de fábrica). **No:** RLS off (expondría la tabla al anon key) ni política de lectura anónima.
- **Sí:** 5 filas seed ficticias, listadas arriba para revisión; Sala Soles es la principal. **No:** tabla vacía.
- **Sí:** `supabase-js`/`@supabase/ssr` fuera de alcance. **No:** instalar deps o env vars.
- **No:** `updated_at` en `daycares` — la referencia no lo incluye y es entidad raíz de solo lectura por ahora.

## Risks

| Riesgo                                               | Mitigación                                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Migración directa a BD remota sin guardia local      | Esquema vacío, tabla nueva y migración registrada en `supabase_migrations`; nada existente que romper. |
| Archivo en repo puede desincronizarse de la BD remota | El archivo es espejo del SQL aplicado (misma version `20261007184831`); una futura spec de CLI lo reconcilia. |
| Datos ficticios confunden un futuro seed real        | Los 5 nombres/direcciones están listados en la spec; una futura spec de CRUD los reemplaza con UPDATE. |
| Tabla con RLS sin políticas es invisible al Data API | A propósito: nadie consume la tabla todavía; las políticas llegan con la spec de integración/Auth.     |

## What is **not** in this spec

- `supabase-js`, `@supabase/ssr` o variables de entorno.
- Supabase CLI (el archivo de migración se crea a mano; no se ejecuta `db push`).
- Políticas RLS (solo habilitación).
- El resto de tablas del esquema.
- Cualquier cambio en la app, mocks o UI.

Cada uno de esos, si llega, va en su propia spec.
