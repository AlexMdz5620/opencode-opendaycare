# Migration Report: Dev → Production (Supabase)

**Fecha:** 2026-10-26
**Origen:** `tffklxeenwscrphijyrx` (OpenDayCare, dev) — accesible vía Supabase MCP
**Destino:** `ecqgjwsbegsxoiobbhgv` (OpenDaycare-Prod) — greenfield, vía Supabase CLI + psql

## Objetivo

Volcado completo de la base de desarrollo a la instancia de producción: esquema (tablas, tipos, funciones, triggers, políticas RLS), data (incluyendo usuarios de `auth` y storage) y archivos del bucket.

## Stack / herramientas

- `npx supabase` CLI **v2.122.0** (no instalado globalmente; `supabase login` ejecutado por el usuario en su terminal)
- `psql` **17.2** (local) — restore vía pooler Supavisor IPv4
- Supabase MCP (`execute_sql`, `list_tables`, `list_migrations`) — inventario del origen
- Ambos proyectos en PostgreSQL **17.11**

## Inventario del origen (antes del volcado)

## Inventario del origen (antes del volcado)

| Elemento                        | Valor                                                                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Tablas `public`                 | 9: daycares, users, rooms, children, invitations, parent_children, posts, post_children, post_photos                         |
| Filas                           | 5 / 4 / 3 / 1 / 4 / 3 / 3 / 3 / 1 (en el mismo orden)                                                                        |
| RLS                             | Habilitado en las 9 tablas; 13 políticas en `public` + 3 en `storage.objects`                                                |
| Funciones `SECURITY DEFINER`    | `accept_invitation`, `get_invitation_by_code`, `rls_auto_enable`                                                             |
| Event trigger                   | `ensure_rls` (ddl_command_end → auto-habilita RLS en CREATE TABLE de `public`) — **pieza de la plataforma**, no del proyecto |
| Auth                            | 3 usuarios confirmados + 3 identities + 1 sesión + 1 refresh token                                                           |
| Storage                         | Bucket público `post-photos` + 1 objeto (69 bytes, PNG)                                                                      |
| Historial `supabase_migrations` | 15 migraciones (remoto) vs 13 archivos locales (drift de 2)                                                                  |

## Proceso ejecutado

### 1. Acceso

1. `npx supabase login` (browser, ejecutado por el usuario — la shell de agente no es TTY).
2. `supabase link` al proyecto dev con password de `.env` (`SUPABASE_DB_PASS`).

### 2. Volcado (Supabase CLI → `backup/`)

```bash
supabase db dump --linked -s public                    -f backup/schema-public.sql      # DDL: tablas, tipos, funciones, políticas, grants
supabase db dump --linked --data-only -s public        -f backup/data-public.sql
supabase db dump --linked --data-only -s auth          -f backup/data-auth.sql          # auth completo (sin excluir)
supabase db dump --linked --data-only -s storage       -f backup/data-storage.sql       # metadata de bucket/objects
supabase db dump --project-ref <dev> --data-only -s supabase_migrations -f backup/data-migrations.sql
```

Archivos complementares generados:

- `backup/storage-policies.sql` — 3 políticas de `storage.objects` (extraídas de la migración `20261021185112`; el esquema `storage` no se recrea porque ya existe en prod).
- `backup/schema-event-trigger.sql` — DDL del event trigger (pg_dump con `-n public` lo excluye).
- `backup/schema-migrations.sql` — DDL de `supabase_migrations.schema_migrations` (escrito a mano desde `information_schema`; la tabla no existía en prod).
- `backup/bucket/*.png` — archivo físico descargado del bucket dev (MD5 = eTag `bd454c7c241d392688d5ea42322030f2`).

### 3. Ajustes sobre los dumps

| Ajuste                                                                                                  | Motivo                                                                                                                         |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Eliminar `SET session_replication_role = replica;` de los 3 data dumps                                  | Requiere superuser; `postgres` en Supabase es `rolsuper=false` (sí tiene `BYPASSRLS`). El orden de INSERTs ya respeta las FKs. |
| Reescribir `tffklxeenwscrphijyrx.supabase.co` → `ecqgjwsbegsxoiobbhgv.supabase.co` en `data-public.sql` | La URL de `post_photos.url` debía apuntar al dominio de prod (1 ocurrencia).                                                   |
| Comentar líneas sin `CLAVE=valor` en `.env`                                                             | El parser dotenv del CLI fallaba con líneas libres.                                                                            |

### 4. Restore en producción (psql, orden determinista)

Conexión: pooler Supavisor **IPv4** (`aws-0-us-east-1.pooler.supabase.com:5432`, `sslmode=require`), usuario **`postgres.ecqgjwsbegsxoiobbhgv`** (el sufijo `.<project-ref>` es el tenant identifier obligatorio de Supavisor). Cada archivo con `-1 -v ON_ERROR_STOP=1`:

1. `schema-public.sql`
2. `schema-migrations.sql`
3. `storage-policies.sql`
4. `schema-event-trigger.sql` _(resultó ya existente: es de la plataforma)_
5. `data-migrations.sql` → `INSERT 0 15`
6. `data-auth.sql`
7. `data-public.sql`
8. `data-storage.sql`

### 5. Archivo del bucket

- Descarga desde la URL pública de dev (69 bytes, MD5 = eTag).
- `PUT /storage/v1/object/post-photos/<path>` con `x-upsert: true` y `service_role` de prod → OK.
- Metadata `cacheControl` reparada a `max-age=3600` (paridad con dev; el endpoint `/object/update` no existe en esta versión de storage, se ajustó por SQL).

## Verificación (dev ↔ prod)

**23/23 métricas idénticas:**

| Métrica                                               | Valor                                                                                   |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Filas de las 9 tablas `public`                        | 5 / 4 / 3 / 1 / 4 / 3 / 3 / 3 / 1                                                       |
| `auth.users` / identities / sessions / refresh_tokens | 3 / 3 / 1 / 1                                                                           |
| `storage.buckets` / `objects`                         | 1 / 1                                                                                   |
| Historial de migraciones                              | 15                                                                                      |
| Tablas con RLS en `public`                            | 9 de 9                                                                                  |
| Políticas `public` / `storage`                        | 13 / 3                                                                                  |
| Funciones / índices `public`                          | 3 / 24                                                                                  |
| `public.users` enlazadas a `auth.users`               | 3 de 4 _(la fila `manuel.mendozac.dev@gmail.com` no tiene par en auth — igual que dev)_ |
| URL de la foto en dominio prod                        | 1 de 1                                                                                  |

Spot-checks de contenido: emails de `auth` (3/3 confirmados), roles y match de `public.users`, códigos de invitación (4). Checks estilo _security advisors_: 0 tablas sin RLS, 0 funciones `SECURITY DEFINER` sin `search_path`, 0 views en `public`.

## Artefactos

- `backup/*.sql` — dumps y DDL (gitignored: contiene hashes bcrypt + datos personales).
- `backup/bucket/*.png` — archivo del bucket.
- `MIGRATION-REPORT.md` — este documento.

## Caveats y siguientes pasos

1. **`.env`**: líneas sin formato `CLAVE=valor` (actuales 13, 14, 16) rompen todos los comandos `supabase` CLI con `failed to parse environment file: .env`. Formatearlas o comentarlas con `#`.
2. **App apunta a dev**: `NEXT_PUBLIC_SUPABASE_URL` en `.env` sigue siendo el proyecto dev; cambiarla al desplegar en prod.
3. **Historial de migraciones**: prod conoce las 15 migraciones del origen → un `supabase db push` futuro solo aplicará migraciones nuevas. Ojo: 2 de las 15 no tienen espejo local (`seed_child_no_photo_consent_test`, `delete_child_no_photo_consent_test`).
4. **Tokens de sesión**: los access tokens JWT firmados con el secreto de dev caducan en prod; los refresh tokens migrados permiten que sesiones existentes renueven el primer token nuevo.
5. **CDN**: el header `Cache-Control` servido por el borde CDN puede tardar en reflejar `max-age=3600` (la metadata en BD ya es la correcta).
6. **`supabase/.temp/`**: archivos de estado efímero del link quedaron sin trackear; considerar agregar `supabase/.temp/` al `.gitignore`.
