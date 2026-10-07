# SPEC 08 — Tabla `users` y enums `user_role`/`user_status` en Supabase vía migración MCP

> **Estado:** Draft
> **Depende de:** SPEC 07
> **Fecha:** 2026-10-07
> **Objetivo:** Crear la tabla `public.users` con los enums `user_role` y `user_status` mediante una única migración MCP con RLS sin políticas y un usuario Staff sembrado (Alex, Guardería Sala Soles), registrando la migración como archivo espejo en `supabase/migrations/`.

## Scope

**In:**

- Migración única vía MCP `apply_migration` (name: `create_users_table`): 2 `CREATE TYPE` + `CREATE TABLE` + `ENABLE ROW LEVEL SECURITY` + 1 `INSERT` en un solo statement set.
- Enums `user_role` (`staff`, `parent`, `admin`) y `user_status` (`pending`, `active`), valores en inglés (convención de la referencia `docs`).
- Tabla `public.users` con las columnas de la referencia + `email text not null unique` (identificador provisional; ver Decisions).
- FK `daycare_id` → `daycares(id)` `not null` con `on delete cascade`.
- Seed de 1 fila: Staff `Alex` / `alex@googl.com` / `status active` / daycare = `Guardería Sala Soles` (resuelto por subquery sobre el nombre).
- RLS habilitado **sin políticas**: la tabla queda cerrada al Data API / `anon` key.
- Verificación con `execute_sql` (esquema, enums, datos), `list_tables` y `get_advisors(security)`.
- Archivo espejo en el repo: `supabase/migrations/<version>_create_users_table.sql` con el mismo SQL aplicado (misma `version` de `schema_migrations`), patrón SPEC 07.

**Out of scope (for future specs):**

- FK `users.id` → `auth.users(id)` (decisión explícita del usuario: "sin FK por ahora"; llega con la spec de Auth).
- Persistir la contraseña (`Abc123456@` queda documentada solo en esta spec para la futura spec de Auth; no se guarda en la BD).
- Supabase Auth, `supabase-js`, `@supabase/ssr`, variables de entorno, Supabase CLI.
- Trigger `AFTER INSERT` en `auth.users` que crea la fila de `users` (mencionado en la referencia; depende de Auth).
- Políticas RLS (solo habilitación).
- Los otros 4 enums (`relationship_type`, `invitation_status`, `post_type`, `child_status`) y las tablas restantes (`rooms`, `children`, `parent_children`, `invitations`, `posts`, …).
- Login, UI o cualquier cambio en el código de la app, mocks o `package.json`.
- CRUD o visualización de usuarios.

## Data model

Migración remota única (nombre `create_users_table`):

```sql
create type user_role as enum ('staff', 'parent', 'admin');
create type user_status as enum ('pending', 'active');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id) on delete cascade,
  role user_role not null,
  status user_status not null default 'active',
  email text not null unique,
  full_name text not null,
  avatar_url text,
  notify_on_post boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

insert into public.users (daycare_id, role, status, email, full_name)
select d.id, 'staff', 'active', 'alex@googl.com', 'Alex'
from public.daycares d
where d.name = 'Guardería Sala Soles';
```

Seed (1 fila):

| full_name | email          | role  | status | daycare_id                     |
| --------- | -------------- | ----- | ------ | ------------------------------ |
| Alex      | alex@googl.com | staff | active | Guardería Sala Soles (subquery) |

No hay cambios en el repo aún: ninguna estructura TS existente se modifica. Durante la implementación se crea solo el archivo de migración espejo.

## Implementation plan

1. **Preparación.** Cargar las skills `supabase` y `supabase-postgres-best-practices` (regla de AGENTS.md); con `list_tables` confirmar que solo existe `daycares` (5 filas) y con `execute_sql` sobre `pg_type`/`pg_enum` que `user_role`/`user_status` no existen. _Prueba: `daycares` única tabla; 0 enums nuevos._
2. **Migración.** Ejecutar `apply_migration` con name `create_users_table` y el SQL anterior. _Prueba: la tool reporta éxito sin error._
3. **Verificación de enums.** `execute_sql` contra `pg_enum`: `user_role` con `staff, parent, admin` y `user_status` con `pending, active` en ese orden. _Prueba: 3 y 2 valores exactos._
4. **Verificación de esquema.** `execute_sql` contra `information_schema.columns`, `table_constraints` y `pg_class`: 11 columnas, `daycare_id` `NOT NULL` con FK a `daycares`, `email` `NOT NULL` + `UNIQUE`, defaults (`status='active'`, booleanos `true`), `relrowsecurity = true`. _Prueba: los 11 datos coinciden con el Data model._
5. **Verificación de datos.** `execute_sql`: `count(*) = 1`; la fila tiene `alex@googl.com`, `Alex`, `staff`, `active` y `daycare_id` = id de `Guardería Sala Soles`. _Prueba: 1 fila correcta._
6. **Advisors.** `get_advisors(security)`: ningún hallazgo sobre `users` (el INFO `rls_enabled_no_policy` es intencional). _Prueba: sin hallazgos nuevos._
7. **Archivo de migración en el repo.** Crear `supabase/migrations/<version>_create_users_table.sql` a mano con el mismo SQL; confirmar la fila `create_users_table` en `supabase_migrations.schema_migrations` y que la `version` del archivo coincide. _Prueba: archivo existe, SQL idéntico, versión coincide._
8. **Repo.** `git status` muestra solo `specs/08-users-table.md` y el archivo de migración nuevo; `package.json` sin dependencias nuevas. _Prueba: sin deps; la app intacta._

## Acceptance criteria

- [ ] Existen los tipos `user_role` (`staff`, `parent`, `admin`) y `user_status` (`pending`, `active`) con ese orden exacto.
- [ ] `public.users` existe con las 11 columnas del Data model.
- [ ] `daycare_id` es `NOT NULL` con FK → `daycares(id)`.
- [ ] `email` es `NOT NULL` y `UNIQUE`; `full_name` es `NOT NULL`.
- [ ] `role` es `NOT NULL` tipo `user_role`; `status` es `NOT NULL` con default `'active'`.
- [ ] `notify_on_post` y `daily_summary_enabled` son `NOT NULL` con default `true`; `avatar_url` es nullable.
- [ ] `relrowsecurity` en `pg_class` para `users` es `true`.
- [ ] `pg_policies` devuelve 0 políticas para `users`.
- [ ] `select count(*) from public.users` devuelve `1`.
- [ ] La fila seed es `Alex` / `alex@googl.com` / `staff` / `active` / daycare = `Guardería Sala Soles`.
- [ ] `users` no tiene columna de contraseña.
- [ ] `users.id` no tiene FK a `auth.users`.
- [ ] `supabase_migrations.schema_migrations` contiene `create_users_table`.
- [ ] `get_advisors(security)` no reporta hallazgos sobre `users` (el INFO `rls_enabled_no_policy` es intencional).
- [ ] Existe `supabase/migrations/<version>_create_users_table.sql` con el SQL idéntico a la migración remota.
- [ ] No se agregaron dependencias ni se modificó código de la app.
- [ ] `git status` no muestra cambios fuera de `specs/08-users-table.md` y el archivo de migración.

## Decisions

- **Sí:** solo `user_role` + `user_status` (los 2 que usa `users`). **No:** los 4 enums restantes — quedan huérfanos; llegan con sus tablas.
- **Sí:** sin FK → `auth.users` (decisión explícita del usuario); se crea en la futura spec de Auth. **No:** fila mínima en `auth.users` ni Admin API (requiere service key/supabase-js).
- **Sí:** `email text not null unique` como identificador provisional mientras no hay Auth. **No:** guardar la contraseña en la BD (texto plano, duplica Auth) — `Abc123456@` queda documentada solo aquí para la spec de Auth. Desviación respecto de la referencia `docs`, registrada a propósito.
- **Sí:** `daycare_id NOT NULL` con seed en `Guardería Sala Soles` (decisión del usuario). **No:** nullable.
- **Sí:** FK `daycare_id` → `daycares` con `on delete cascade`. **No:** sin FK (la relación daycare↔users es el núcleo de esta spec).
- **Sí:** 1 usuario Staff de prueba (`Alex`). **No:** tabla vacía ni usuarios padre (llegan con su spec de invitaciones).
- **Sí:** RLS habilitado sin políticas + archivo espejo en `supabase/migrations/`, mismo patrón que SPEC 07. **No:** RLS off ni Supabase CLI.
- **No:** trigger de `updated_at` automático — la referencia no lo define; se agrega cuando existan UPDATEs reales.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `users` queda desconectada de Auth (sin FK) | FK diferida a la spec de Auth; `email` provisorio documenta el identificador mientras tanto. |
| Contraseña del staff de prueba sin persistencia | A propósito: no se guardan secretos en la BD; queda anotada en esta spec para la futura spec de Auth. |
| `email` en `users` duplicará `auth.users` cuando llegue Auth | Decisión provisional explícita; la spec de Auth decidirá si elimina la columna o la mantiene. |
| `on delete cascade` en `daycare_id` borraría usuarios si se borra el daycare | Consistente con el patrón de la referencia; el seed de daycares no se elimina. |

## What is **not** in this spec

- FK a `auth.users`, Supabase Auth, login o persistencia de contraseñas.
- Políticas RLS (solo habilitación).
- Los otros 4 enums y el resto de tablas del esquema.
- Cualquier cambio en la app, mocks o UI.

Cada uno de esos, si llega, va en su propia spec.
