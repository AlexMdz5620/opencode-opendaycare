# AGENTS.md: open-daycare

## Commands

| Action                  | Command         |
| ----------------------- | --------------- |
| Start dev server        | `npm run dev`   |
| Build for production    | `npm run build` |
| Start production server | `npm run start` |
| Lint                    | `npm run lint`  |

## Framework notes

- **Next.js 16.3.6** — this version has breaking changes. APIs, conventions, and file structure may differ from older Next.js training data. Check `node_modules/next/dist/docs/` for the guide before writing code.
- **Tailwind CSS v4** — installed but config is minimal (`postcss.config.mjs`). Class names in `app/` use Tailwind v4 syntax (e.g., `bg-zinc-50`, `dark:bg-black`). Do not assume v3 patterns.
- **App directory** — `app/page.tsx` is the home entrypoint. `app/layout.tsx` sets up `Fredoka`/`Nunito` font variables. New pages go in `app/`.
- **ESLint** — config in `eslint.config.mjs`. Ignores `.next/`, `out/`, `build/`. Runs via `npm run lint`.

## MCP configs

- Playwright tests must use the `.playwright-mcp` folder.
- Context7 MCP is used to fetch framework documentation.
- **Supabase MCP** (remote, `https://mcp.supabase.com/mcp`) está habilitado a nivel global en `~/.config/opencode/opencode.json`. Proyecto: `tffklxeenwscrphijyrx`. Herramientas disponibles: `execute_sql`, `apply_migration`, `get_advisors`, `list_tables`, `search_docs`, `query_logs`, Edge Functions, branching, etc. Úsalo para trabajar con la base de datos (no adivines el estado del esquema).
- **Migraciones obligatorias**: SIEMPRE que se manipule la base de datos (crear/modificar/eliminar tablas, columnas, índices, constraints, funciones, triggers, políticas RLS, etc.) se debe usar `apply_migration` (vía MCP o CLI). NUNCA usar `execute_sql` para DDL/cambios de esquema; `execute_sql` es solo para consultas de lectura o verificación puntual.

## Quick setup

1. `npm install` to install dependencies
2. `npm run dev` starts the dev server at `http://localhost:3000`
3. Edit `app/page.tsx` to modify the home page

## Supabase

### Paquetes oficiales de Supabase para Next.js

- La app interactúa con la base de datos **siempre** con los paquetes oficiales de Supabase: `@supabase/supabase-js` (cliente) y `@supabase/ssr` (sesiones por cookies para SSR). Instalados en `package.json`. No usar `fetch` crudo a la REST API ni otros clientes.
- Helpers en `utils/supabase/` (alias `@/utils/supabase/`):
  - `client.ts` → `createClient()` para Client Components (browser).
  - `server.ts` → `createClient()` (async, usa `await cookies()`) para Server Components, Server Actions y Route Handlers.
  - `proxy.ts` → `updateSession(request)`, refresca el token con `auth.getClaims()`.
- `proxy.ts` en la raíz: en Next 16 `middleware.ts` se renombró a `proxy.ts` (ver `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`). Llama a `updateSession` y define el `matcher`. No redirigir a `/login` desde el proxy hasta que exista la spec de autenticación.
- Env vars en `.env.local` (gitignored): `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `.env.template` documenta las públicas; `.env` contiene `SUPABASE_DB_PASS` (secret, nunca commitear).
- Las claves con prefijo `NEXT_PUBLIC_` se envían al browser: nunca poner `service_role` / secret keys ahí.

### Esquema y migraciones

- Migraciones imperativas en `supabase/migrations/` (existen `daycares`, `users`). La referencia de tablas/columnas del diseño está en `../07-DB-Schema` (ver `opencode.json` → `references`), solo documentación.
- Antes de escribir SQL o tocar el esquema, cargar las skills de Supabase (ver sección siguiente).
- Todo cambio de esquema o datos va por **migraciones** (`apply_migration`), nunca SQL suelto con `execute_sql`.
- RLS está habilitado en las tablas de `public` **sin políticas**: el cliente anon conecta pero lee 0 filas. Las políticas se definen en specs de `specs/database/`.

## Spec Driven Development - Skills

- /spec Usaremos esta habilidad para crear las especificaciones.
- **Especificaciones de base de datos**: cualquier spec que tenga que ver con la base de datos (esquema, tablas, columnas, migraciones, RLS, índices, funciones, triggers, etc.) debe guardarse en `specs/database/` (ej. `specs/database/01-users-table.md`), no en la raíz de `specs/`.
- /spec-impl Usaremos esta skill para hacer las implementaciones.
- /spec-verify Comando de Verify Spec: verifica y marca los criterios de aceptación de una spec (código, UI, docs de Next.js y screenshots).

## Supabase Skills (instaladas en `.agents/skills/`)

- **supabase** — cargar con el skill tool cuando la tarea involucre Supabase (DB, Auth, Edge Functions, Realtime, Storage, RLS, CLI, MCP, debugging). Fuente: `supabase/agent-skills`.
- **supabase-postgres-best-practices** — cargar ANTES de escribir o modificar cualquier cosa viva en Postgres: tablas/columnas, diseño de esquema, migraciones, políticas RLS, índices, triggers, funciones, pg_cron/pgmq, pgvector, y al diagnosticar queries lentas o problemas de seguridad/performance. Fuente: `supabase/agent-skills`.
- Ambas están registradas en `skills-lock.json`. Se cargan automáticamente cuando la descripción coincide con la tarea, o manualmente vía el skill tool.

## Agents

- **spec-verifier** (`.opencode/agents/spec-verifier.md`): agente que ejecuta el flujo de `/spec-verify`. Revisa los criterios de aceptación, corrige código fallido, valida con Playwright + Context7 y actualiza los checkboxes de la spec. No hace commits.

## Reglas de código

- Usa código limpio, nombres, funciones, variables, etc. en inglés.
