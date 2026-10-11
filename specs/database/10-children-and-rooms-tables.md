# SPEC 10 — Tablas `rooms` y `children` con 3 salas sembradas y `/kids` conectado a Supabase

> **Estado:** Approved
> **Depende de:** SPEC 02, SPEC 04, SPEC 07, SPEC 09
> **Fecha:** 2026-10-09
> **Objetivo:** Crear las tablas `rooms` y `children` con RLS y políticas para `authenticated`, sembrar 3 salas por defecto (Soles, Lunas, Estrellas) sin niños, y que `/kids` y `/kids/[id]` listen y creen niños desde Supabase en lugar de mocks o localStorage.

## Scope

**In:**

- Migración única vía MCP `apply_migration` (name: `create_rooms_children_tables`): `create type child_status` + `create table rooms` + `create table children` + índices de FK + `enable row level security` + policies + seed de 3 salas, en un solo statement set.
- Tabla `public.rooms`: `id uuid PK default gen_random_uuid()`, `daycare_id uuid not null references daycares(id) on delete cascade`, `name text not null`, `created_at timestamptz not null default now()`.
- Tabla `public.children`: las 11 columnas de la referencia `@db-schema` (`room_id` nullable FK → rooms, `full_name`, `birth_date`, `enrolled_at default current_date`, `medical_notes`, `allergy_tags text[]`, `photo_consent default true`, `status child_status default 'active'`, `created_at`/`updated_at`).
- Enum `child_status` (`active`, `archived`) creado en esta migración aunque la UI aún no lo use.
- Seed: exactamente 3 salas — `Soles`, `Lunas`, `Estrellas` — con `daycare_id` = `Guardería Sala Soles` (subquery por nombre). **0 filas en `children`**.
- Policies RLS `to authenticated`: `SELECT` en `rooms` y `children`, `INSERT` en `children` (sin UPDATE/DELETE: la edición queda fuera de alcance).
- Archivo espejo `supabase/migrations/<version>_create_rooms_children_tables.sql` con el mismo SQL (patrón SPEC 07/08).
- `app/kids/page.tsx` pasa a consultar `rooms` + `children` con `utils/supabase/server.ts` y derivar `Kid[]` en el servidor.
- Server Action `addChild` en `app/kids/actions.ts` (nuevo): valida los 3 obligatorios con el patrón de SPEC 04/09, hace el `INSERT` (alergias → `text[]` por split de comas), `revalidatePath("/kids")` en éxito.
- `components/kids/AddKidModal.tsx`: conectado a la Server Action con `useActionState`; el `<select>` de SALA se pobla con las salas de BD.
- `components/kids/KidsScreen.tsx`: recibe `kids` y `rooms` por props; agrupación en secciones/acordeón por las salas de BD (salas sin niños ocultas, comportamiento SPEC 04); estado vacío con mensaje `Aún no hay niños registrados` cuando `kids.length === 0`; sin lectura de `localStorage`.
- `app/kids/[id]/page.tsx`: lee el niño de BD por uuid; `notFound()` para uuid con formato inválido o sin fila; se desconectan `getKidById` (mocks) y la rama `local-` (los archivos no se borran).
- Buscador `Buscar niño…` sigue siendo visual.

**Out of scope (for future specs):**

- Editar o archivar niños (el enum `child_status` existe pero no hay UI de edición/borrado lógico).
- CRUD de salas (solo el seed; ninguna pantalla de gestión de salas).
- Vincular padres (`parent_children`) e invitaciones.
- Buscador funcional (sigue visual).
- Borrar `app/_data/kids.ts`, `app/_data/localKids.ts`, `components/kid-profile/LocalKidProfile.tsx`; fallback a mocks o localStorage.
- Subida de fotos o UI para `photo_consent`.
- Policies para `anon` o RLS multi-tenant por daycare.
- Reflejar los niños nuevos en el feed/home de SPEC 01.
- Supabase CLI.

## Data model

Migración remota única (nombre `create_rooms_children_tables`):

```sql
create type child_status as enum ('active', 'archived');

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id),
  full_name text not null,
  birth_date date not null,
  enrolled_at date not null default current_date,
  medical_notes text,
  allergy_tags text[],
  photo_consent boolean not null default true,
  status child_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rooms_daycare_id_idx on public.rooms (daycare_id);
create index children_room_id_idx on public.children (room_id);

alter table public.rooms enable row level security;
alter table public.children enable row level security;

create policy "rooms_select_authenticated"
  on public.rooms for select to authenticated using (true);
create policy "children_select_authenticated"
  on public.children for select to authenticated using (true);
create policy "children_insert_authenticated"
  on public.children for insert to authenticated with check (true);

insert into public.rooms (daycare_id, name)
select d.id, r.name
from public.daycares d
cross join (values ('Soles'), ('Lunas'), ('Estrellas')) as r(name)
where d.name = 'Guardería Sala Soles';
```

Seed: `Soles`, `Lunas`, `Estrellas` → Guardería Sala Soles. `children`: 0 filas.

Estado de la Server Action (`app/kids/actions.ts`):

```ts
interface AddKidState {
  error?: string; // "Este campo es obligatorio"
  success?: boolean; // cierra el modal
}
```

Derivación fila → `Kid` (reutiliza la interface de `app/_data/kids.ts`, sin modificarla):

- `id` = uuid de la fila; `initial` = primera letra de `full_name` en mayúscula.
- `ageYears` calculada de `birth_date` contra hoy; `birthDate` display `dd mmm yyyy` (mismo formato que los mocks).
- `joinDate` = mes/año de `enrolled_at` (`oct 2026`).
- `allergies`: `{ badge: primer tag.toUpperCase(), text: tags.join(", ") }`; sin tags → `undefined`.
- `parents: []` (sin `parent_children` todavía); paleta de avatar rotativa por índice (5 combos de SPEC 04).

Convención: las salas se ordenan por `created_at` (orden de inserción: Soles, Lunas, Estrellas).

## Implementation plan

1. **Preparación.** Cargar las skills `supabase` y `supabase-postgres-best-practices` (regla de AGENTS.md) y con `list_tables` confirmar que solo existen `daycares` y `users`. _Prueba: sin `rooms` ni `children`._
2. **Migración.** Ejecutar `apply_migration` con name `create_rooms_children_tables` y el SQL del Data model. _Prueba: la tool reporta éxito sin error._
3. **Verificación de BD.** `execute_sql`: columnas y nullables de ambas tablas, enum `child_status`, índices, `pg_policies` (3 policies `to authenticated`), `count(*) rooms = 3` con las 3 salas en Guardería Sala Soles, `count(*) children = 0`; `get_advisors(security)`. _Prueba: todo coincide con el Data model; sin hallazgos nuevos._
4. **Archivo espejo.** Crear `supabase/migrations/<version>_create_rooms_children_tables.sql` con el mismo SQL; confirmar la fila en `supabase_migrations.schema_migrations`. _Prueba: versión del archivo = version de la BD._
5. **Server Action.** Crear `app/kids/actions.ts` con `addChild(prevState, formData)`: vacíos → `{ error: "Este campo es obligatorio" }`; `INSERT` con `allergy_tags` del split de comas (trim + filtrar vacíos), `medical_notes` opcional; éxito → `revalidatePath("/kids")` + `{ success: true }`. _Prueba: `npx tsc --noEmit` limpio._
6. **Lista desde BD.** `app/kids/page.tsx` consulta con el server client (children `status = 'active'`, rooms orden `created_at`), deriva `Kid[]` y pasa `kids` y `rooms` a `KidsScreen`. _Prueba: `/kids` con sesión muestra header + buscador + estado vacío; sin sesión → `/login`._
7. **KidsScreen sin localStorage.** Quitar `loadLocalKids` y su `useEffect`; agrupar por `rooms` de props en `KidsRoomSection`; ocultar salas sin niños; estado vacío con `Aún no hay niños registrados` cuando no hay hijos. _Prueba: no se pintan mocks ni locales aunque existan en `localStorage`._
8. **Modal a BD.** `AddKidModal` con `useActionState(addChild, …)`, select poblado con las `rooms` de props (default `Soles`), cierre en `success`, error inline; `KidsHeader` conserva `onAdd`. _Prueba: guardar completo → cierra, recarga y el niño aparece en su sala; vacío → errores y no cierra._
9. **Perfil desde BD.** `app/kids/[id]/page.tsx`: validar formato uuid antes de consultar (`/kids/99` o `/kids/hola` → `notFound()`), `select(...).maybeSingle()` → `null` = `notFound()`; quitar `getKidById` y la rama `local-`. _Prueba: el perfil del niño creado muestra sus datos reales; el 404 nativo sigue funcionando._
10. **Cierre.** _Prueba: `npm run lint`, `npx tsc --noEmit` y consola sin errores en `/`, `/kids` y el perfil de un niño creado._

## Acceptance criteria

- [x] Existen `public.rooms` (4 columnas) y `public.children` (11 columnas) con RLS habilitado.
- [x] `child_status` existe con valores `active`, `archived` en ese orden.
- [x] `rooms.daycare_id` es `NOT NULL` con FK → `daycares(id)`; `children.room_id` es nullable con FK → `rooms(id)`.
- [x] `children.enrolled_at` tiene default `current_date`; `photo_consent` default `true`; `status` default `'active'`.
- [x] `select count(*) from public.rooms` devuelve `3` con exactamente `Soles`, `Lunas`, `Estrellas`, todas en Guardería Sala Soles.
- [x] `select count(*) from public.children` devuelve `0`.
- [x] `pg_policies` muestra 3 policies `to authenticated`: SELECT en `rooms`, SELECT e INSERT en `children`; ninguna para `anon` ni de UPDATE/DELETE.
- [x] Existen los índices `rooms_daycare_id_idx` y `children_room_id_idx`.
- [x] `supabase_migrations.schema_migrations` contiene `create_rooms_children_tables` y el archivo espejo coincide con esa versión.
- [x] `get_advisors(security)` no reporta hallazgos nuevos sobre estas tablas.
- [x] `/kids` con sesión muestra el header, el buscador visual y el mensaje `Aún no hay niños registrados` (sin secciones de sala).
- [x] `/kids` sin sesión redirige a `/login`.
- [x] El `<select>` SALA del modal ofrece `Soles`, `Lunas`, `Estrellas` desde la BD, con `Soles` por defecto.
- [x] Con cualquiera de los 3 obligatorios vacío, `Guardar` no cierra ni inserta y ese campo muestra borde rojo + `Este campo es obligatorio`.
- [x] Tras guardar completo, el modal se cierra y el niño aparece en `/kids` dentro de su sala con divisor `SALA X · N niños` (singular `1 niño`).
- [x] El niño existe en `public.children` con `room_id` correcto, `allergy_tags` como array, `status = 'active'` y `enrolled_at = hoy` (verificable con `execute_sql`).
- [x] Recargar `/kids` mantiene el niño (viene de la BD, no de `localStorage`).
- [x] Con un niño en `localStorage` de SPEC 04, `/kids` NO lo pinta.
- [x] La tarjeta navega a `/kids/<uuid>` y el perfil muestra nombre, `N años · Sala X`, fecha de nacimiento formatada, `Ingreso` = mes de `enrolled_at` y `PADRES VINCULADOS` en estado vacío.
- [x] Sin alergias no se renderiza el banner; con alergias el banner muestra el texto completo y la tarjeta el badge con la primera etiqueta en mayúsculas.
- [x] `/kids/99` y `/kids/hola` muestran el 404 nativo de Next.js (sin error de consulta por uuid inválido).
- [x] El acordeón de salas contrae/expande con `aria-expanded` y todas arrancan expandidas.
- [x] `app/_data/kids.ts` y `app/_data/localKids.ts` quedan intactos (solo desconectados de `/kids`).
- [x] `npm run lint` pasa sin errores.
- [x] `npx tsc --noEmit` pasa sin errores.
- [x] No hay errores ni avisos de hidratación en la consola de `/`, `/kids` y el perfil de un niño creado.

## Decisions

- **Sí:** spec en `specs/database/` (regla de AGENTS.md: toca esquema, migraciones y RLS). **No:** `specs/` raíz.
- **Sí:** la BD manda en `/kids`; mocks y localStorage dejan de pintarse. **No:** fallback a mocks (ocultaría el estado vacío real) ni mantener dos fuentes de verdad.
- **Sí:** alcance crear + listar + perfil. **No:** editar/archivar (`child_status` queda creado sin UI) — llega en su propia spec.
- **Sí:** seed de 3 salas por migración, sin CRUD de salas. **No:** pantalla de gestión de salas.
- **Sí:** `name` = `Soles`/`Lunas`/`Estrellas` y la UI conserva el calco `SALA SOLES`. **No:** `Sala Soles` literal (rompe los divisores de SPEC 02/04).
- **Sí:** `daycare_id` fijo en Guardería Sala Soles por subquery (patrón SPEC 08). **No:** daycare del usuario en sesión (depende de `users`/metadata y RLS sin políticas lo bloquearía).
- **Sí:** RLS ON + policies `to authenticated` (SPEC 09 ya exige sesión en `/kids`). **No:** patrón "RLS sin políticas" de SPEC 07/08 (la app no podría leer con la publishable key) ni policies para `anon`.
- **Sí:** solo SELECT e INSERT; sin UPDATE/DELETE (edición fuera de alcance). **No:** policy de update "por si acaso".
- **Sí:** índices en las FK (`rooms.daycare_id`, `children.room_id`) siguiendo `supabase-postgres-best-practices`. **No:** dejarlos sin indexar.
- **Sí:** Server Action + `useActionState` + `revalidatePath` (patrón SPEC 09). **No:** `insert` desde el browser client (la lista no se refrescaría sola y el repo ya validó el patrón de actions).
- **Sí:** una sola migración CREATE + enum + índices + RLS + policies + seed (patrón "una sola migración" de SPEC 07). **No:** migraciones separadas.
- **Sí:** reutilizar la interface `Kid` de `app/_data/kids.ts` y derivar en el server. **No:** tipo nuevo ni derivación en el client.
- **Sí:** validar formato de uuid antes de consultar el perfil. **No:** consultar directo (Postgres tira `22P02` con ids como `99`) ni envolver todo en try/catch que enmascara errores reales.
- **Sí:** desconectar localStorage sin borrar archivos. **No:** eliminar `localKids.ts`/`LocalKidProfile` (limpieza en otra spec) ni conservarlos como fallback.
- **Sí:** estado vacío con mensaje. **No:** mostrar las 3 salas con `· 0 niños`.
- **Sí:** buscador sigue visual. **No:** filtrar (con 0 niños no aporta).
- **Nota:** esta spec modifica criterios ya marcados de SPEC 02 (la lista ya no pinta los 8 mocks; el perfil ya no usa `getKidById`) y de SPEC 04 (el modal guarda en BD, no en `localStorage`; la rama `local-` del perfil queda desconectada).

## Risks

| Riesgo                                                                               | Mitigación                                                                                                                        |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Policies `using (true)` dejan leer cualquier daycare a cualquier usuario autenticado | Asumible con una sola guardería relevante; el RLS multi-tenant por daycare queda para una spec futura (documentado en Decisions). |
| Id `uuid` inválido en `/kids/[id]` rompe la query (`22P02`)                          | Validar formato uuid antes del `select` y llamar `notFound()` (criterio verificable con `/kids/hola`).                            |
| Quitar `loadLocalKids`/`getKidById` deja imports huérfanos o rompe componentes       | `npx tsc --noEmit` en cada paso; los archivos se desconectan sin borrarse.                                                        |
| El modal client + Server Action puede no refrescar la lista                          | `revalidatePath("/kids")` en la action; verificado recargando tras guardar.                                                       |
| Orden de salas distinto al seed si alguien inserta después                           | Orden por `created_at`; documentado como convención en Data model.                                                                |
| Migración directa a BD remota sin CLI                                                | Mismo patrón de SPEC 07/08: `apply_migration` + archivo espejo verificado contra `schema_migrations`.                             |

## What is **not** in this spec

- Editar o archivar niños (`child_status` sin UI).
- CRUD de salas.
- Vincular padres e invitaciones.
- Buscador funcional.
- Borrar los mocks/localStorage o fallback hacia ellos.
- Policies para `anon`, multi-tenant por daycare, Supabase CLI.
- Niños nuevos visibles en el feed/home.

Cada uno de esos, si llega, va en su propia spec.
