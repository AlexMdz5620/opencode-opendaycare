# Open DayCare

Aplicación de gestión para guarderías (feed diario, niños, salas, invitaciones a padres) construida con [Next.js 16](https://nextjs.org) (App Router), Tailwind CSS v4 y [Supabase](https://supabase.com) (Postgres + Auth).

## Requisitos

- Node.js 20 o superior y npm
- Una cuenta en [Supabase](https://supabase.com) con acceso a la organización del proyecto
- (Opcional) [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) para migraciones y gestión del proyecto
- (Opcional) Cuenta en [Resend](https://resend.com) para el envío de correos de invitación

## Levantar el proyecto

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo de entorno local (PowerShell: Copy-Item .env.template .env.local)
cp .env.template .env.local

# 3. Completar .env.local con tus valores (ver tabla siguiente)

# 4. Arrancar el servidor de desarrollo
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en el navegador.

| Comando         | Descripción                  |
| --------------- | ---------------------------- |
| `npm run dev`   | Servidor de desarrollo       |
| `npm run build` | Build de producción          |
| `npm run start` | Sirve el build de producción |
| `npm run lint`  | Lint (ESLint)                |

## Variables de entorno

`.env.local` está en `.gitignore`: nunca se commitea. El template completo está en `.env.template`.

| Variable                               | Descripción                                                                                   |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL del proyecto Supabase (Dashboard → Project Settings → API)                                |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publicable (`sb_publishable_...`)                                                       |
| `SUPABASE_DB_PASS`                     | Password de la base de datos (para `supabase link` / `db push`; solo en `.env`, no commitear) |
| `SUPABASE_SERVICE_ROLE_KEY`            | Clave de server-side. **Nunca** en client components ni con prefijo `NEXT_PUBLIC_`            |
| `RESEND_API_KEY`                       | API key de Resend para enviar invitaciones                                                    |
| `RESEND_FROM`                          | Remitente de los correos (ej. `OpenDayCare <onboarding@resend.dev>`)                          |
| `NEXT_PUBLIC_APP_URL`                  | URL base de la app (default `http://localhost:3000`), usada en los links de invitación        |

> Las variables con prefijo `NEXT_PUBLIC_` se envían al browser: nunca pongas ahí secretos.

## Supabase

- **Proyecto remoto:** `<project-id>` — el ID de tu proyecto de Supabase (se ve en el Dashboard → Project Settings → General → Reference ID) — <https://supabase.com/dashboard/project/<project-id>>
- **Migraciones:** viven en `supabase/migrations/`. Todo cambio de esquema (tablas, columnas, índices, RLS, funciones) va por una migración, nunca SQL suelto desde el dashboard.
- La app habla con la base de datos solo con los paquetes oficiales (`@supabase/supabase-js` + `@supabase/ssr`), via los helpers de `utils/supabase/` (`client.ts`, `server.ts`, `proxy.ts`).

### Aplicar migraciones

```bash
supabase migration new nombre-del-cambio
supabase db push
```

En el flujo con agentes de IA (opencode) las migraciones se aplican con la herramienta `apply_migration` del MCP de Supabase; en ambos casos el SQL queda registrado como archivo en `supabase/migrations/`.

## Autenticación con el MCP de Supabase

Este proyecto usa el MCP remoto de Supabase (`https://mcp.supabase.com/mcp`) para que los agentes de IA consulten el esquema, apliquen migraciones, lean logs, etc. Está configurado **a nivel global** en `~/.config/opencode/opencode.json` (no en el repo).

### ¿Cómo se autentica uno?

**Flujo normal (recomendado): OAuth en el navegador.** No hace falta crear tokens a mano. Para validar y autenticar la conexión del MCP con opencode, ejecutá:

```bash
opencode mcp auth supabase
```

1. El comando abre el navegador para autorizar el acceso.
2. Iniciás sesión con tu **cuenta propia de Supabase**.
3. Elegís la **organización que contiene el proyecto** y aprobás el acceso.
4. El cliente MCP queda conectado; el token lo gestiona el cliente, no vos.

Cada desarrollador se autentica con su propia cuenta, y el acceso respeta el rol que tenga en la organización. Si el cliente no detecta las herramientas tras autorizar, reiniciá el cliente MCP.

**Flujo manual / CI: personal access token.** Cuando no hay navegador (CI, entornos sin display):

1. Creá un token en <https://supabase.com/dashboard/account/tokens> (preferentemente un token _scoped_, con solo los permisos necesarios).
2. Pasalo como header de autorización en la configuración del MCP:

```json
{
  "mcp": {
    "supabase": {
      "type": "remote",
      "url": "https://mcp.supabase.com/mcp?project_ref=<project-id>",
      "headers": {
        "Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}"
      }
    }
  }
}
```

### Recomendaciones de seguridad

- No conectes el MCP a datos de producción; usá el proyecto de desarrollo.
- Preferí el scoping a un proyecto (`?project_ref=...`) y, para lecturas, `?read_only=true`.
- Revisá cada llamada a herramientas antes de aprobarla en el cliente MCP.

Docs oficiales: <https://supabase.com/docs/guides/ai-tools/mcp>

## Supabase CLI: login y equipo

### Instalación y login (cada desarrollador)

```bash
# Instalar la CLI
npm install -g supabase

# Login: abre el navegador con tu cuenta de Supabase
supabase login

# Alternativa sin navegador: token manual
supabase login --token sbp_XXXXXXXX

# Vincular el repo al proyecto remoto, usando el ID de tu proyecto de
# Supabase (pide el password de la base; también puede pasarse con -p
# o la env var SUPABASE_DB_PASSWORD)
supabase link --project-ref <project-id>
```

El access token se guarda en el keychain del sistema (o en `~/.supabase/access-token` como fallback). En CI no se hace `login`: se define la variable `SUPABASE_ACCESS_TOKEN`.

### Autenticar a tu equipo

La invitación de miembros se hace desde el dashboard, no desde la CLI:

1. Como owner/admin de la organización: Dashboard de Supabase → **Organization Settings → Members → Invite**.
2. Ingresá el email del compañero y el rol (Developer, Read-only, etc.).
3. El compañero acepta el email y crea (o vincula) su **propia** cuenta de Supabase.
4. Cada miembro repite en su máquina los pasos de login de arriba: `supabase login` con su cuenta y, si usa agentes de IA, su propia autorización OAuth del MCP.

**Importante:** los tokens (PAT del CLI y del MCP) son personales: cada uno genera los suyos en <https://supabase.com/dashboard/account/tokens> y **nunca se comparten** entre miembros. Preferí tokens _scoped_ limitados a la organización/proyecto sobre los tokens clásicos de acceso total.

## Docs útiles

- [Supabase MCP Server](https://supabase.com/docs/guides/ai-tools/mcp)
- [Supabase CLI — `login`](https://supabase.com/docs/reference/cli/supabase-login)
- [Personal Access Tokens](https://supabase.com/docs/guides/platform/personal-access-tokens)
- [Next.js](https://nextjs.org/docs) · [Deploy en Vercel](https://nextjs.org/docs/app/building-your-application/deploying)
