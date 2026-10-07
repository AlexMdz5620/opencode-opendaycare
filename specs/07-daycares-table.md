# SPEC 07 — Primera tabla `daycares` en Supabase vía migración MCP

> **Estado:** Draft
> **Depende de:** Ninguna
> **Fecha:** 2026-10-07
> **Objetivo:** Crear la tabla `public.daycares` en Supabase con una única migración aplicada por MCP que habilita RLS sin políticas e inserta 5 guarderías, siendo la principal la Guardería Sala Soles.

## Scope

**In:**

- Migración única vía MCP `apply_migration` (name: `create_daycares_table`) que hace las 3 cosas en un solo paso: `CREATE TABLE`, `ENABLE ROW LEVEL SECURITY` y 5 `INSERT`.
- Tabla `public.daycares` con `id uuid PK default gen_random_uuid()`, `name text not null`, `address text not null` (campo agregado respecto a la referencia `docs`) y `created_at timestamptz not null default now()`.
- Seed de 5 guarderías (tabla en Data model); la importante es `Guardería Sala Soles`.
- RLS habilitado **sin políticas**: la tabla queda cerrada al Data API / `anon` key.
- Verificación con `execute_sql`, `list_tables` y `get_advisors(security)`.

**Out of scope (for future specs):**

- `supabase-js`, `@supabase/ssr` y variables de entorno (decisión del usuario).
- Supabase CLI ni carpeta `supabase/migrations/` en el repo (el patrón es MCP directo).
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

No hay cambios de datos en el repo: ninguna estructura TS existente se modifica.

## Implementation plan

1. **Preparación.** Cargar las skills `supabase` y `supabase-postgres-best-practices` (regla de AGENTS.md) y confirmar con `list_tables` que `public` sigue vacío. _Prueba: `tables = []`._
2. **Migración.** Ejecutar `apply_migration` con name `create_daycares_table` y el SQL anterior (CREATE + RLS + 5 INSERT en un solo statement set). _Prueba: la tool reporta éxito sin error._
3. **Verificación de esquema.** `execute_sql` contra `information_schema.columns` y `pg_class`: 4 columnas, PK en `id` con default `gen_random_uuid()`, `name`/`address` `is_nullable = 'NO'`, `relrowsecurity = true`. _Prueba: los 5 datos coinciden con el Data model._
4. **Verificación de datos.** `execute_sql`: `count(*) = 5` y existe la fila `Guardería Sala Soles` con dirección no nula. _Prueba: 5 filas, Soles presente._
5. **Registro y advisors.** Confirmar la fila `create_daycares_table` en `supabase_migrations.schema_migrations` y correr `get_advisors(security)`. _Prueba: migración registrada; ningún hallazgo sobre `daycares`._
6. **Repo intacto.** `git status` sin cambios y `package.json` sin dependencias nuevas. _Prueba: limpio; la app no se tocó._

## Acceptance criteria

- [ ] `public.daycares` existe con `id uuid`, `name text`, `address text`, `created_at timestamptz`.
- [ ] `id` es PRIMARY KEY con default `gen_random_uuid()`.
- [ ] `name` y `address` tienen `is_nullable = 'NO'`.
- [ ] `select count(*) from public.daycares` devuelve `5`.
- [ ] Existe exactamente una fila con `name = 'Guardería Sala Soles'` y dirección no nula.
- [ ] Las 5 filas tienen `name` y `address` no nulos.
- [ ] `relrowsecurity` en `pg_class` para `daycares` es `true`.
- [ ] `pg_policies` devuelve 0 políticas para `daycares` (tabla cerrada al anon key).
- [ ] `supabase_migrations.schema_migrations` contiene `create_daycares_table`.
- [ ] `get_advisors(security)` no reporta hallazgos relacionados con `daycares`.
- [ ] No se creó carpeta `supabase/` ni se agregaron dependencias (`package.json` sin `supabase-js`).
- [ ] `git status` no muestra cambios fuera de `specs/07-daycares-table.md`.

## Decisions

- **Sí:** MCP `apply_migration` directo al proyecto remoto (`tffklxeenwscrphijyrx`). **No:** Supabase CLI (no está instalado) ni carpeta `supabase/migrations/` — opción A elegida.
- **Sí:** una sola migración con CREATE + RLS + seed. **No:** migraciones separadas (decisión explícita del usuario: "una sola").
- **Sí:** `address text not null` además de los 3 campos de la referencia `docs`. **No:** limitarse al doc ni hacerlo nullable.
- **Sí:** RLS habilitado sin políticas (tabla cerrada de fábrica). **No:** RLS off (expondría la tabla al anon key) ni política de lectura anónima.
- **Sí:** 5 filas seed ficticias, listadas arriba para revisión; Sala Soles es la principal. **No:** tabla vacía.
- **Sí:** `supabase-js`/`@supabase/ssr` fuera de alcance. **No:** instalar deps o env vars.
- **No:** `updated_at` en `daycares` — la referencia no lo incluye y es entidad raíz de solo lectura por ahora.

## Risks

| Riesgo                                                             | Mitigación                                                                                        |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Migración directa a BD remota sin guardia local                    | Esquema vacío, tabla nueva y migración registrada en `supabase_migrations`; nada existente que romper. |
| Datos ficticios confunden un futuro seed real                      | Los 5 nombres/direcciones están listados en la spec; una futura spec de CRUD los reemplaza con UPDATE. |
| Tabla con RLS sin políticas es invisible al Data API               | A propósito: nadie consume la tabla todavía; las políticas llegan con la spec de integración/Auth.  |

## What is **not** in this spec

- `supabase-js`, `@supabase/ssr` o variables de entorno.
- Supabase CLI o carpeta `supabase/migrations/`.
- Políticas RLS (solo habilitación).
- El resto de tablas del esquema.
- Cualquier cambio en la app, mocks o UI.

Cada uno de esos, si llega, va en su propia spec.
