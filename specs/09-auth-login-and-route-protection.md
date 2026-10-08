# SPEC 09 — Login real con Supabase Auth y protección de rutas

> **Estado:** Approved
> **Depende de:** SPEC 03, SPEC 08
> **Fecha:** 2026-10-08
> **Objetivo:** Conectar el login existente a Supabase Auth (solo email y password) mediante una Server Action y proteger todas las rutas con guards en `proxy.ts`, con logout real desde el sidebar.

## Scope

**In:**

- Server Action `login` en `app/login/actions.ts` (nuevo): valida campos vacíos, ejecuta `signInWithPassword` con `utils/supabase/server.ts`, y en éxito `revalidatePath("/", "layout")` + `redirect("/")`.
- `LoginForm.tsx` pasa a client con `useActionState(login, …)`: inputs con `name`, sin `defaultValue`, error inline, botón submit deshabilitado con label `Ingresando…` mientras `pending`.
- Guards de rutas en `utils/supabase/proxy.ts` (`updateSession`): capturar el resultado de `getClaims()`; sin sesión + ruta protegida → redirect `/login`; con sesión en `/login` → redirect `/`; `/activate-account` siempre accesible y sin redirect de salida.
- Logout: el `Link href="#"` de `Cerrar sesión` en `SidebarContent` (`components/shared/Sidebar.tsx`) pasa a botón con `signOut()` (browser client de `utils/supabase/client.ts`) + navegación a `/login`. Como el drawer mobile reutiliza `SidebarContent`, cubre desktop y mobile.
- Paso manual documentado: crear `alex@google.com` / `Abc123456@` (autoconfirmado) en Supabase Dashboard → Authentication → Users. _Hecho vía migraciones en lugar del Dashboard (desviación aprobada, ver Decisions)._
- Ya vienen del pull (commit `6348217`, sin cambios del spec): `@supabase/ssr@^0.12.7`, `@supabase/supabase-js@^2.117.3`, `utils/supabase/{client,server,proxy}.ts`, `proxy.ts` raíz con matcher, `.env.template` completo.

**Out of scope (for future specs):**

- Signup / activación por código de invitación real (requiere tabla `invitations`).
- Flujo de `¿Olvidaste tu contraseña?`.
- FK `users.id` → `auth.users(id)` y trigger `AFTER INSERT` sobre `public.users` (SPEC 08 lo difirió; spec futura en `specs/database/`).
- Mostrar el usuario real en la UI (autor de los posts y avatar del `Composer` siguen mocks). _El sidebar footer con nombre/inicial real se agregó como adición solicitada por el usuario fuera del alcance original, ver Decisions._
- Políticas RLS sobre `users`, Edge Functions, protección de rutas de API.

## Data model

Esta spec no introduce estructuras de datos nuevas. La sesión vive en cookies gestionadas por `@supabase/ssr`. La acción `login` maneja un estado plano:

```ts
// Estado que devuelve la Server Action a useActionState
interface LoginState {
  error?: string; // "Este campo es obligatorio" | "Email o contraseña incorrectos"
}
```

## Implementation plan

1. **Server Action.** Crear `app/login/actions.ts` con `login(prevState, formData)`: vacíos → `{ error: "Este campo es obligatorio" }`; `signInWithPassword` fallido → `{ error: "Email o contraseña incorrectos" }`; éxito → `revalidatePath` + `redirect("/")`. _Prueba: `npx tsc --noEmit` limpio._
2. **LoginForm.** `"use client"` + `useActionState`; quitar `defaultValue`; error rojo `#D9583C`; botón `type="submit"` deshabilitado con `Ingresando…`. _Prueba: con Alex creado, login exitoso aterriza en `/`; vacíos y contraseña mala muestran su error sin navegar._
3. **Guards.** En `utils/supabase/proxy.ts`, usar el resultado de `getClaims()` para los redirects (`/login` y `/activate-account` son públicas; el resto protegido). No se toca `proxy.ts` raíz. _Prueba: anónimo en `/` y `/kids` → `/login`; `/login` y `/activate-account` responden; con sesión, `/login` → `/`._
4. **Logout.** Botón en `SidebarContent` con `signOut()` + `/login`. _Prueba: logout → `/login`; recargar `/` sin sesión → `/login`; drawer mobile igual._
5. **Cierre.** _Prueba: `npm run lint`, `npx tsc --noEmit` y consola limpia en `/`, `/login`, `/kids`._

## Acceptance criteria

- [x] Con sesión anónima, `/` y `/kids` redirigen a `/login`.
- [x] `/login` y `/activate-account` son accesibles sin sesión.
- [x] Login con `alex@google.com` / `Abc123456@` redirige a `/`.
- [x] Recargar en `/` mantiene la sesión (no vuelve a `/login`).
- [x] Con sesión, visitar `/login` redirige a `/`.
- [x] Contraseña incorrecta muestra `Email o contraseña incorrectos` en rojo y no navega.
- [x] Email o contraseña vacíos muestran `Este campo es obligatorio` y no envían.
- [x] El botón `Iniciar sesión` muestra `Ingresando…` y está deshabilitado mientras se procesa.
- [x] El campo EMAIL ya no tiene `defaultValue`.
- [x] `Cerrar sesión` (sidebar desktop y drawer mobile) cierra sesión y aterriza en `/login`.
- [x] Tras el logout, `/` sin sesión redirige a `/login`.
- [x] Sin errores de consola en `/`, `/login` y `/kids`.
- [x] `npm run lint` y `npx tsc --noEmit` pasan sin errores.

## Decisions

- **Sí:** login en Server Action (`app/login/actions.ts`) con `utils/supabase/server.ts`. **No:** `signInWithPassword` en el client; **no:** el login dentro del proxy — Context7 (docs Supabase): el proxy solo refresca el token, lo pasa a Server Components/browser y redirige.
- **Sí:** guards con el resultado de `getClaims()` (el refresh ya lo llama; las docs lo prefieren sobre `getUser()`). **No:** cambiar la llamada existente ni correr código entre `createServerClient` y la llamada de auth (advertencia de las docs).
- **Sí:** `useActionState` para error y `pending`. **No:** `useState` manual ni errores por query param (`/login?error=1`).
- **Sí:** guards solo en `utils/supabase/proxy.ts`; `proxy.ts` raíz queda como wrapper. **No:** lógica duplicada en la raíz ni checks por layout (el refresh exige proxy).
- **Sí:** logout client con browser client (`SidebarContent` ya es `"use client"` y se reutiliza en el drawer). **No:** server action para logout.
- **Sí:** vaciar el `defaultValue`. **No:** conservar el mock del calco (contradice "real contra Supabase").
- **Sí:** FK + trigger users↔auth.users en spec futura de `specs/database/`. **No:** migración en esta spec.
- **Sí:** Alex creado a mano en el Dashboard con las credenciales de SPEC 08. **No:** `INSERT` en `auth.users` ni Admin API.
- **Sí (desviación aprobada por el usuario durante la implementación):** crear el usuario de Auth con `apply_migration` en lugar del Dashboard: migraciones `seed_alex_auth_user` (bcrypt vía `extensions.crypt`, `email_confirmed_at = now()` autoconfirmado, `identity` email) + `fix_alex_auth_user_email_change` (GoTrue escanea `email_change` como `string`; `NULL` rompía `/token` con 500). **No:** columna de password en `public.users` — se mantiene la decisión de SPEC 08 (el password vive solo en `auth.users.encrypted_password`).
- **Sí (desviación aprobada):** restaurar la fila seed de `public.users` (había desaparecido: 0 filas) con la migración `restore_users_seed`, idempotente (`not exists`). **No:** re-sembrar con SQL suelto fuera de migración.
- **Sí (adición solicitada por el usuario, fuera del alcance original):** sidebar footer con el usuario real — `SidebarContent` lee la sesión con el browser client (`getSession`) y muestra `full_name` + inicial + `role · room` desde `raw_user_meta_data` (migración `update_alex_auth_user_metadata`); fallback al email o al mock `SIDEBAR_USER`. **No:** leer `public.users` (RLS sin políticas la bloquea) ni agregar políticas RLS (queda para la spec de perfil); **no:** tocar el avatar del `Composer` ni el autor de los posts (siguen mocks).
- **Sí:** error genérico de credenciales + patrón de campo vacío de SPEC 04/05. **No:** exponer el mensaje crudo de Supabase.
- **Sí:** infraestructura tomada del pull tal cual (`package.json` y `.env.template` intactos). **No:** reinstalar deps ni reescribir helpers.

## Risks

| Riesgo                                                                    | Mitigación                                                                                             |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `redirect()` en la Server Action lanza `NEXT_REDIRECT`                    | No envolver la acción completa en `try/catch`; solo `signInWithPassword` si hace falta capturar error. |
| Guard con el shape de `getClaims()` (`data?.claims`) distinto al esperado | Lo valida `npx tsc --noEmit`; fallback documentado a `getUser()`.                                      |
| El estado client (FeedContext) queda con datos tras logout                | Ir a `/login` recarga; las cookies ya se borraron y el proxy bloquea.                                  |
| `useActionState` exige React 19                                           | `react@19.2.8` ya instalado.                                                                           |

## What is **not** in this spec

- Signup / activación real por invitación.
- Recuperación de contraseña.
- FK y trigger `users` ↔ `auth.users` (spec database/ futura).
- Datos reales del usuario en la UI.

Cada uno de esos, si llega, va en su propia spec.
