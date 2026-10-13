# SPEC 11 — Invitación de padre por correo (Resend) y registro con código

> **Estado:** Approved
> **Depende de:** SPEC 03, SPEC 05, SPEC 08, SPEC 09, SPEC 10
> **Fecha:** 2026-10-13
> **Objetivo:** Que el staff cree una invitación real desde el modal del perfil del niño, que el padre reciba el código por correo vía Resend y que al activar su cuenta en `/activate-account` quede vinculado al niño en `parent_children`.

## Scope

**In:**

- Migración vía MCP `apply_migration` (name: `create_invitation_tables`): enums `relationship_type` (`father`, `mother`, `guardian`) e `invitation_status` (`pending`, `accepted`, `expired`, `cancelled`), tablas `invitations` y `parent_children` con índices, RLS habilitado y policies.
- Policies: `SELECT` `to authenticated` en `invitations`, `parent_children` y `users` (necesaria para que `ParentsCard` lea los nombres de los padres); `INSERT` `to authenticated` en `invitations`. Sin UPDATE/DELETE.
- Migración (name: `create_invitation_functions`): 2 funciones `security definer` — `get_invitation_by_code(code)` (lectura segura del código antes de existir sesión) y `accept_invitation(code)` (crea la fila en `users`, inserta en `parent_children` y marca la invitación `accepted` con `accepted_at`).
- Archivo espejo en `supabase/migrations/` para ambas migraciones (patrón SPEC 07–10).
- Dependencia `resend` (npm) y env vars `RESEND_API_KEY`, `RESEND_FROM`, `NEXT_PUBLIC_APP_URL` documentadas en `.env.template`.
- `utils/email.ts` (nuevo): singleton del cliente Resend + `sendInvitationEmail({ to, fullName, kidFirstName, code })` con asunto y cuerpo en español, link `${NEXT_PUBLIC_APP_URL}/activate-account?code={code}` y texto `Vence en 7 días`.
- Server Action `createInvitation(prevState, formData)` en `app/kids/actions.ts`: patrón de SPEC 09/10 — valida nombre/email vacíos e email inválido con los mensajes ya usados; resuelve `invited_by` por el email de la sesión contra `public.users`; inserta la invitación (`status 'pending'`, `expires_at = now() + 7 days`, `code` = el generado en el cliente); envía el correo con Resend; en éxito `{ success: true }`.
- `LinkParentModal` conectado a la Server Action con `useActionState`: mismo calco, mismos errores inline; en `success` cierra el modal. El código del bloque amarillo pasa a ser el que se persiste y se envía (ya no es decorativo).
- `/activate-account` real: `app/activate-account/page.tsx` (server) lee `searchParams.code`, llama `get_invitation_by_code` y, si es válida, `InviteCard` muestra el niño y sala reales y el campo código (y email) quedan prellenados. Sin código o inválido: formulario usable, tarjeta sin datos reales, sin errores de render.
- Server Action `activateAccount(prevState, formData)` en `app/activate-account/actions.ts`: valida vacíos; `signUp` (confirmación de email desactivada, paso manual documentado); llama `accept_invitation`; en éxito `revalidatePath("/", "layout")` + `redirect("/")` (login automático). Errores: código inválido/expirado, email ya registrado (`Este email ya tiene una cuenta. Iniciá sesión.`), contraseña corta.
- `ParentsCard` desde BD: `app/kids/[id]/page.tsx` consulta `parent_children` join `users` para el niño y deriva `KidParent[]` (`Mamá`/`Papá`/`Tutor/a` desde el enum); estado vacío cuando no hay vínculos.
- Paso manual documentado: desactivar "Confirm email" en Supabase Dashboard → Authentication → Providers → Email (para que solo llegue el correo de Resend).
- `.env.local` del developer con `RESEND_API_KEY` real y `RESEND_FROM` en modo onboarding (`OpenDayCare <onboarding@resend.dev>`): el correo solo se entrega a la dirección del propio developer hasta verificar un dominio.

**Out of scope (for future specs):**

- Reenviar, cancelar o renovar invitaciones (no hay UI ni endpoint).
- Validar duplicados (mismo email ya invitado al mismo niño; se pueden crear varias invitaciones, gana la que se acepte).
- Marcar `expired` con cron: la expiración se evalúa en el momento (`status = 'pending' and expires_at > now()`).
- Filtrar el feed del padre (`/` sigue mostrando todo; requiere `post_children`).
- Recuperación de contraseña, editar perfil, cambiar contraseña.
- Persistir el checkbox de fotos de `/activate-account` (`children.photo_consent` lo maneja el staff al inscribir).
- FK `users.id` → `auth.users(id)` (queda en su spec futura, patrón SPEC 09).
- Policies de UPDATE/DELETE, RLS multi-tenant por daycare, Admin API/service_role.
- Borrado de mocks de `app/_data/kids.ts` (solo se desconecta `ParentsCard` de la lista mock).

## Data model

Migración 1 (name: `create_invitation_tables`):

```sql
create type relationship_type as enum ('father', 'mother', 'guardian');
create type invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  invited_by uuid not null references public.users(id),
  full_name text not null,
  email text not null,
  relationship relationship_type not null,
  code text not null unique,
  status invitation_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.parent_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  relationship relationship_type not null,
  created_at timestamptz not null default now(),
  unique (parent_id, child_id)
);

create index invitations_child_id_idx on public.invitations (child_id);
create index invitations_invited_by_idx on public.invitations (invited_by);
create index parent_children_parent_id_idx on public.parent_children (parent_id);
create index parent_children_child_id_idx on public.parent_children (child_id);

alter table public.invitations enable row level security;
alter table public.parent_children enable row level security;

create policy "invitations_select_authenticated"
  on public.invitations for select to authenticated using (true);
create policy "invitations_insert_authenticated"
  on public.invitations for insert to authenticated with check (true);
create policy "parent_children_select_authenticated"
  on public.parent_children for select to authenticated using (true);
create policy "users_select_authenticated"
  on public.users for select to authenticated using (true);
```

Migración 2 (name: `create_invitation_functions`), funciones `security definer` (search_path fijo, `grant execute` a `anon` y `authenticated`):

- `get_invitation_by_code(p_code text)` → devuelve `status`, `expires_at`, `full_name`, `email`, `child_first_name`, `room_name` (o fila vacía). Usada por `/activate-account` sin sesión.
- `accept_invitation(p_code text)` → con `auth.uid()` ya activo: valida `pending` + no vencida; crea `public.users` con `id = auth.uid()`, `role 'parent'`, `status 'active'`, `email`/`full_name` de la invitación, `daycare_id` resuelto vía `children → rooms → daycare`; inserta `parent_children` (`relationship` de la invitación); marca la invitación `accepted` + `accepted_at = now()`. Devuelve `child_id` o lanza error (`invalid_code` / `expired_code`).

Mapeo de parentesco: pill `Mamá` → `mother`, `Papá` → `father`, `Tutor/a` → `guardian` (inverso para mostrar en `ParentsCard`).

Estado de las Server Actions:

```ts
// app/kids/actions.ts
interface CreateInvitationState {
  error?: string; // "Este campo es obligatorio" | "Ingresá un email válido" | "No se pudo enviar el correo"
  success?: boolean;
}

// app/activate-account/actions.ts
interface ActivateState {
  error?: string; // vacíos | "Código inválido o expirado" | "Este email ya tiene una cuenta. Iniciá sesión." | "La contraseña debe tener al menos 6 caracteres"
}
```

Convención `invited_by`: se resuelve por `select id from users where email = <email de la sesión>` (SPEC 08/09 dejaron `users.id` sin FK a `auth.users`, así que `auth.uid()` no sirve para el staff sembrado). El usuario creado en el registro sí usa `id = auth.uid()` (avanza hacia la FK futura).

## Implementation plan

1. **Preparación.** Cargar skills `supabase` y `supabase-postgres-best-practices`; con `list_tables` y `execute_sql` confirmar que no existen los enums ni las tablas nuevas. _Prueba: solo `daycares`, `users`, `rooms`, `children`._
2. **Migración de tablas.** `apply_migration` `create_invitation_tables` con el SQL del Data model. _Prueba: la tool reporta éxito._
3. **Migración de funciones.** `apply_migration` `create_invitation_functions` con las dos RPCs. _Prueba: éxito; `get_invitation_by_code('NOPE')` devuelve fila vacía._
4. **Verificación de BD.** `execute_sql` (enums en orden, columnas, unique, índices, policies, funciones) + `get_advisors(security)`. _Prueba: todo coincide con el Data model._
5. **Archivos espejo.** Crear los dos `.sql` en `supabase/migrations/` y confirmar versiones contra `schema_migrations`. _Prueba: versiones y SQL idénticos._
6. **Resend.** `npm install resend`; `.env.template` con `RESEND_API_KEY`, `RESEND_FROM`, `NEXT_PUBLIC_APP_URL`; crear `utils/email.ts`. _Prueba: `npx tsc --noEmit` limpio._
7. **createInvitation.** Server Action en `app/kids/actions.ts` + `LinkParentModal` con `useActionState`. _Prueba manual: con sesión de Alex, enviar invitación a tu propio email → llega el correo con código y link; fila `pending` en BD; modal cierra._
8. **Activación.** `page.tsx` lee `?code=`, RPC para `InviteCard` y prefill; `activateAccount` en `app/activate-account/actions.ts`; conectar `ActivateForm`. _Prueba: link del correo → tarjeta real → registro → aterriza en `/` con sesión; código malo muestra error sin crear cuenta._
9. **ParentsCard desde BD.** Query en `app/kids/[id]/page.tsx` + mapeo a `KidParent[]`. _Prueba: tras activar, el perfil del niño muestra al padre con su parentesco._
10. **Cierre.** _Prueba: `npm run lint`, `npx tsc --noEmit`, consola limpia en `/activate-account`, el perfil del niño y `/`._

## Acceptance criteria

- [ ] Existen `relationship_type` (`father`, `mother`, `guardian`) e `invitation_status` (`pending`, `accepted`, `expired`, `cancelled`) en ese orden.
- [ ] `public.invitations` tiene las 11 columnas del Data model con `code UNIQUE` y `status` default `'pending'`; RLS habilitado.
- [ ] `public.parent_children` tiene `unique (parent_id, child_id)`; RLS habilitado.
- [ ] `pg_policies`: SELECT en `invitations`, `parent_children` y `users`, INSERT en `invitations`, todas `to authenticated`; ninguna de UPDATE/DELETE ni para `anon`.
- [ ] Las funciones `get_invitation_by_code` y `accept_invitation` existen como `security definer`.
- [ ] Los archivos espejo en `supabase/migrations/` coinciden con las versiones de `schema_migrations`.
- [ ] `get_advisors(security)` no reporta hallazgos nuevos por estas tablas/funciones.
- [ ] `Enviar invitación` con nombre y email válidos cierra el modal, inserta la invitación con el mismo código del bloque amarillo y `expires_at` = ahora + 7 días.
- [ ] Llega un correo (Resend) a la dirección ingresada con el código, el link `/activate-account?code=…` y la vigencia de 7 días.
- [ ] Con `RESEND_API_KEY` inválida, el modal muestra `No se pudo enviar el correo` y no cierra.
- [ ] La validación del modal no cambia: vacíos → `Este campo es obligatorio`; formato → `Ingresá un email válido`.
- [ ] El link del correo abre `/activate-account` con el código prellenado y la tarjeta muestra el nombre del niño y su sala reales.
- [ ] `/activate-account` sin código renderiza el formulario sin errores ni datos reales en la tarjeta.
- [ ] Código inexistente o vencido → `Código inválido o expirado`, no se crea cuenta ni se navega.
- [ ] Email ya registrado → `Este email ya tiene una cuenta. Iniciá sesión.` y no navega.
- [ ] Registro exitoso crea la fila en `public.users` (`role 'parent'`, `id = auth.uid()`), el vínculo en `parent_children` y la invitación queda `accepted` con `accepted_at` (verificable con `execute_sql`).
- [ ] Tras el registro, el padre aterriza en `/` con sesión activa sin volver a escribir la contraseña.
- [ ] `ParentsCard` en `/kids/[id]` muestra al padre recién activado con el parentesco elegido en el modal.
- [ ] Un niño sin vínculos muestra el estado vacío de `PADRES VINCULADOS`.
- [ ] `npm run lint` pasa sin errores.
- [ ] `npx tsc --noEmit` pasa sin errores.
- [ ] Sin errores ni avisos de hidratación en la consola de `/activate-account`, el perfil del niño y `/`.

## Decisions

- **Sí:** una sola spec en `specs/database/` (decisión del usuario), como la SPEC 10. **No:** partir en spec de BD + spec de app.
- **Sí:** el modal solo crea la invitación; la cuenta la completa el padre con el código (decisión del usuario). **No:** crear la cuenta desde el modal ni generar contraseña temporal.
- **Sí:** link con `?code=` que prellena y campo editable (decisión del usuario: "ambos"). **No:** solo código a mano ni solo link.
- **Sí:** envío desde Server Action con el paquete `resend` y `RESEND_API_KEY`/`RESEND_FROM` en env vars (decisión del usuario). **No:** Edge Function ni route handler.
- **Sí:** login automático tras activar → `redirect("/")` (decisión del usuario). **No:** redirigir a `/login`.
- **Sí:** `ParentsCard` lee de BD en esta spec (decisión del usuario). **No:** dejar la lista vacía.
- **Sí:** desactivar "Confirm email" en el Dashboard como paso manual (decisión del usuario; precedente SPEC 09 con el seed de Alex). **No:** service_role/Admin API (SPEC 08 lo descartó) ni doble correo de Supabase.
- **Sí:** el código del bloque amarillo (generado en el cliente con `generateInviteCode`) es el que se persiste y se envía — mantiene el calco y lo que ve el staff es lo que llega por correo. **No:** generar el código solo en el server (el bloque mostraría un código distinto al real); **no:** código fijo.
- **Sí:** choque de `code UNIQUE` (23505) → reintento server-side con código nuevo y se envía el nuevo. **No:** fallar la acción por una colisión de ~1 en 33 millones.
- **Sí:** dos migraciones (tablas y funciones), mismo patrón espejo de SPEC 07–10. **No:** una sola migración gigante ni SQL suelto.
- **Sí:** RPCs `security definer` para leer/aceptar invitaciones antes de existir sesión (`anon`) y para escribir `users`/`parent_children` sin policies de INSERT (RLS de `users` sigue sin INSERT para el cliente). **No:** policy `SELECT` para `anon` en `invitations` (expondría todos los códigos) ni policies de INSERT en `users`.
- **Sí:** policy `SELECT` nueva sobre `users` para `authenticated` (necesaria para los nombres en `ParentsCard`). **No:** exponer `users` a `anon`; INSERT/UPDATE siguen cerrados.
- **Sí:** `invited_by` resuelto por email de la sesión (SPEC 08/09 dejaron `users.id` sin FK a `auth.users`). **No:** trigger de sincronización en esta spec.
- **Sí:** el registro nuevo usa `users.id = auth.uid()` (apunta a la FK futura). **No:** `gen_random_uuid()` (crearía una tercera identidad sin relación con la sesión).
- **Sí:** expiración evaluada al validar (`pending` + `expires_at > now()`), sin cron. **No:** job programado que pase filas a `expired`.
- **Sí:** patrón de errores y estados de SPEC 04/09/10 (`useActionState`, mensajes ya usados). **No:** toast ni query params de error.
- **Sí:** checkbox de fotos de `/activate-account` sigue visual. **No:** persistirlo (no hay columna en `users`; `children.photo_consent` es del staff).
- **Nota:** con API key sin dominio verificado, Resend entrega solo al email del propio developer (dominio `onboarding@resend.dev`); queda documentado como limitación del entorno, no del código.
- **Nota:** el usuario aprobó la spec por instrucción explícita ("Implementalo y lo reviso") antes de releerla en el archivo; el estado se fija en `Approved` en consecuencia (mismo precedente que SPEC 03).

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Confirmación de email de Supabase sigue activa → dos correos y bloqueo | Paso manual en Scope + criterio verificable: el padre solo recibe el de Resend. |
| `get_invitation_by_code` expone datos con un código adivinado | Códigos de 32^5 con `unique`; la función devuelve solo nombre/child/room (los mismos del correo). Sin policy `anon` sobre la tabla. |
| `accept_invitation` crea `users` y luego falla algo posterior | La función es transaccional (una sentencia); si `signUp` falla, no se llama. Si la invitación es inválida se hace `signOut` + error. |
| Staff sin fila en `public.users` (email de sesión no matchea) | `createInvitation` devuelve error claro; Alex (seed) siempre matchea. |
| `ParentsCard` depende de la nueva policy sobre `users` | Criterio verificado con perfil real y con `execute_sql` sobre `pg_policies`. |
| Sin dominio verificado en Resend, QA limitado al propio email | Registrado en Decisions; el criterio usa la dirección del developer. |

## What is **not** in this spec

- Reenviar, cancelar o renovar invitaciones; validación de duplicados; cron de expiración.
- Feed filtrado por padre, recuperación de contraseña, edición de perfil.
- Persistir el consentimiento de fotos del registro.
- FK `users.id` → `auth.users(id)`; policies de UPDATE/DELETE; multi-tenant por daycare; service_role.
- Borrar `app/_data/kids.ts` o el resto de mocks.

Cada uno de esos, si llega, va en su propia spec.
