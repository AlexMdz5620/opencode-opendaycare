# SPEC 12 — Tablas `posts`, `post_children` y `post_photos` con RLS por audiencia, bucket `post-photos` y fix del vínculo `users` ↔ `auth.users`

> **Estado:** Approved
> **Depende de:** SPEC 07, SPEC 08, SPEC 09, SPEC 11
> **Fecha:** 2026-10-20
> **Objetivo:** Crear el enum `post_type` y las tablas `posts`, `post_children` y `post_photos` con RLS que restringe el INSERT a staff/admin y el SELECT a la audiencia (staff de la daycare + padres de los niños/sala), crear el bucket público `post-photos` con policies de upload solo staff, y corregir el vínculo `users.id` ↔ `auth.users.id` para que `auth.uid()` sea la identidad única.

## Scope

**In:**

- Migración vía MCP `apply_migration` (name: `fix_users_auth_link`): para cada fila de `public.users` cuyo `email` matchea un `auth.users`, remapea en tabla temporal `_id_remap` (`old_id` → `new_id`) las referencias de `invitations.invited_by` y `parent_children.parent_id` **y después** actualiza `users.id = auth.users.id`. Las FKs `invitations.invited_by_fkey` y `parent_children_parent_id_fkey` se eliminan y recrean en la misma transacción (`parent_children` preserva `ON DELETE CASCADE`). Tras la migración, **todo** `users.id` iguala su `auth.users.id` (incluye el staff sembrado de SPEC 08; los usuarios creados por `accept_invitation` en SPEC 11 ya cumplían `id = auth.uid()`).
- Migración (name: `create_posts_tables`): enum `post_type` (`meal`, `nap`, `activity`, `achievement`, `mood`, `photo`, `announcement` — **7 valores**, incluye `mood` que la referencia `@db-schema` no tiene pero la UI de SPEC 06 sí usa) + tablas `posts`, `post_children`, `post_photos` + índices + RLS + policies.
- Tabla `public.posts`: `id uuid PK default gen_random_uuid()`, `author_id uuid not null references users(id)`, `daycare_id uuid not null references daycares(id) on delete cascade` (**columna agregada sobre la referencia `@db-schema`**, ver Decisions), `room_id uuid nullable references rooms(id)`, `type post_type not null`, `title text nullable`, `body text not null`, `published_at timestamptz not null default now()`, `created_at`/`updated_at` `timestamptz not null default now()`.
- Tabla `public.post_children`: `post_id uuid not null references posts(id) on delete cascade`, `child_id uuid not null references children(id) on delete cascade`, `created_at timestamptz not null default now()`, PK compuesta `(post_id, child_id)`.
- Tabla `public.post_photos`: `id uuid PK default gen_random_uuid()`, `post_id uuid not null references posts(id) on delete cascade`, `url text not null`, `width integer` nullable, `height integer` nullable, `position integer not null`, `created_at timestamptz not null default now()`.
- Policies RLS sobre `posts`: `INSERT` solo `staff`/`admin` con `author_id = auth.uid()` y `daycare_id` = daycare del usuario; `SELECT` para staff/admin de la misma daycare del post **∪** padres (posts de sus hijos vía `post_children` ∩ `parent_children` **∪** anuncios con `room_id` = sala de alguno de sus hijos). Sin policies de UPDATE/DELETE (editar/eliminar fuera de alcance).
- Policies sobre `post_children` y `post_photos`: `SELECT` `to authenticated using (true)`; `INSERT` solo `staff`/`admin` (ver Decisions por qué el SELECT no filtra).
- Migración (name: `create_post_photos_bucket`): bucket `post-photos` **público** + policies en `storage.objects`: `INSERT` solo `staff`/`admin` con el primer folder del path igual al `daycare_id` del usuario; `DELETE` solo `staff`/`admin` (necesaria para la limpieza best-effort de SPEC 13); `SELECT` público para el bucket.
- Tres archivos espejo en `supabase/migrations/` con el mismo SQL de cada migración (patrón SPEC 07–11).

**Out of scope (for future specs):**

- Poblar `posts` con seeds o mocks (el feed empieza vacío; lo llena la UI de SPEC 13).
- Policies de UPDATE/DELETE sobre `posts` (editar/eliminar es otra spec).
- Tablas `reactions`, `comments`, `daily_summaries`, `devices` de la referencia `@db-schema`.
- Notificaciones (`users.notify_on_post` queda sin disparar).
- RLS multi-tenant por daycare en las demás tablas (`rooms`, `children`, `invitations`, `users` siguen con sus policies actuales).
- Trigger de `updated_at` automático (se maneja por la app, como el resto de tablas).
- Atribución de fotos a niños individuales (`post_photos` no tiene `child_id`).
- Supabase CLI; políticas para `anon`.

## Data model

Migración 1 (name: `fix_users_auth_link`):

```sql
begin;
  alter table public.invitations drop constraint invitations_invited_by_fkey;
  alter table public.parent_children drop constraint parent_children_parent_id_fkey;

  create temp table _id_remap on commit drop as
    select u.id as old_id, au.id as new_id
    from public.users u
    join auth.users au on au.email = u.email
    where u.id <> au.id;

  update public.invitations i
  set invited_by = r.new_id
  from _id_remap r
  where i.invited_by = r.old_id;

  update public.parent_children pc
  set parent_id = r.new_id
  from _id_remap r
  where pc.parent_id = r.old_id;

  update public.users u
  set id = r.new_id
  from _id_remap r
  where u.id = r.old_id;

  alter table public.invitations
    add constraint invitations_invited_by_fkey
    foreign key (invited_by) references public.users(id);

  alter table public.parent_children
    add constraint parent_children_parent_id_fkey
    foreign key (parent_id) references public.users(id) on delete cascade;
commit;
```

Migración 2 (name: `create_posts_tables`):

```sql
create type post_type as enum
  ('meal', 'nap', 'activity', 'achievement', 'mood', 'photo', 'announcement');

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id),
  daycare_id uuid not null references public.daycares(id) on delete cascade,
  room_id uuid references public.rooms(id),
  type post_type not null,
  title text,
  body text not null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.post_children (
  post_id uuid not null references public.posts(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, child_id)
);

create table public.post_photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  url text not null,
  width integer,
  height integer,
  position integer not null,
  created_at timestamptz not null default now()
);

create index posts_author_id_idx on public.posts (author_id);
create index posts_daycare_id_idx on public.posts (daycare_id);
create index posts_room_id_idx on public.posts (room_id);
create index posts_published_at_idx on public.posts (published_at desc);
create index post_children_child_id_idx on public.post_children (child_id);
create index post_photos_post_id_idx on public.post_photos (post_id);

alter table public.posts enable row level security;
alter table public.post_children enable row level security;
alter table public.post_photos enable row level security;

create policy "posts_insert_staff_admin"
  on public.posts for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('staff', 'admin')
        and u.daycare_id = posts.daycare_id
    )
  );

create policy "posts_select_staff_parent"
  on public.posts for select to authenticated
  using (
    exists (
      select 1 from public.users me
      where me.id = auth.uid()
        and me.role in ('staff', 'admin')
        and me.daycare_id = posts.daycare_id
    )
    or exists (
      select 1
      from public.post_children pc
      join public.parent_children par on par.child_id = pc.child_id
      where pc.post_id = posts.id
        and par.parent_id = auth.uid()
    )
    or (
      posts.room_id is not null
      and exists (
        select 1
        from public.children c
        join public.parent_children par on par.child_id = c.id
        where c.room_id = posts.room_id
          and par.parent_id = auth.uid()
      )
    )
  );

create policy "post_children_select_authenticated"
  on public.post_children for select to authenticated using (true);
create policy "post_children_insert_staff_admin"
  on public.post_children for insert to authenticated
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('staff', 'admin')
    )
  );

create policy "post_photos_select_authenticated"
  on public.post_photos for select to authenticated using (true);
create policy "post_photos_insert_staff_admin"
  on public.post_photos for insert to authenticated
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('staff', 'admin')
    )
  );
```

Migración 3 (name: `create_post_photos_bucket`):

```sql
insert into storage.buckets (id, name, public)
values ('post-photos', 'post-photos', true)
on conflict (id) do nothing;

create policy "post_photos_objects_public_read"
  on storage.objects for select
  using (bucket_id = 'post-photos');

create policy "post_photos_objects_insert_staff_admin"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-photos'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('staff', 'admin')
    )
    and (storage.foldername(name))[1] = (
      select daycare_id::text from public.users where id = auth.uid()
    )
  );

create policy "post_photos_objects_delete_staff_admin"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'post-photos'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('staff', 'admin')
    )
  );
```

Convención de path en el bucket: `{daycare_id}/{post_id}/{posición}-{uuid}.{ext}` (el primer folder es el daycare, el segundo el post — SPEC 13 sube los archivos antes de insertar el post, generando el `post_id` en la action).

Convención de audiencia (contrato para SPEC 13): un post es **de sala** (`room_id` seteado y `post_children` materializado con los niños actuales de esa sala) **o** **de niños puntuales** (`room_id` null y `post_children` solo con esos niños). Nunca mixto. El filtro del padre es la unión de las dos ramas del policy SELECT.

## Implementation plan

1. **Preparación.** Cargar las skills `supabase` y `supabase-postgres-best-practices` (regla de AGENTS.md); con `list_tables` y `execute_sql` confirmar tablas actuales y que `users.id` del staff seed difiere de `auth.users.id`. _Prueba: existe la discrepancia documentada (Alex)._
2. **Migración de fix.** `apply_migration` `fix_users_auth_link` con el SQL del Data model. _Prueba: la tool reporta éxito._
3. **Migración de tablas.** `apply_migration` `create_posts_tables` con enum + tablas + índices + RLS. _Prueba: éxito._
4. **Migración de storage.** `apply_migration` `create_post_photos_bucket` con bucket y 3 policies de `storage.objects`. _Prueba: éxito._
5. **Verificación de BD.** `execute_sql`: `users.id = auth.users.id` para todos los emails matcheados; columnas/nullables de las 3 tablas; enum en orden; índices; `pg_policies` (2 sobre `posts`, 2 sobre `post_children`, 2 sobre `post_photos`, 3 sobre `storage.objects`); sin policies de UPDATE/DELETE; `get_advisors(security)`. _Prueba: todo coincide con el Data model; sin hallazgos nuevos._
6. **Archivos espejo.** Crear los 3 `.sql` en `supabase/migrations/` y confirmar versiones contra `schema_migrations`. _Prueba: versiones y SQL idénticos._

## Acceptance criteria

- [ ] Tras `fix_users_auth_link`, cada `public.users` con email presente en `auth.users` tiene `id` idéntico al de `auth.users` (verificable con `execute_sql`).
- [ ] Las FKs `invitations_invited_by_fkey` y `parent_children_parent_id_fkey` existen tras la migración; `parent_children_parent_id_fkey` conserva `ON DELETE CASCADE`.
- [ ] Ninguna fila de `invitations.invited_by` ni `parent_children.parent_id` quedó huérfana (count antes = count después).
- [ ] Existe `post_type` con los 7 valores en el orden `meal`, `nap`, `activity`, `achievement`, `mood`, `photo`, `announcement`.
- [ ] `public.posts` tiene las 10 columnas del Data model; `daycare_id` es `NOT NULL` con FK → `daycares(id)`; `room_id` es nullable con FK → `rooms(id)`; `title` es nullable; `body` es `NOT NULL`.
- [ ] `public.post_children` tiene `PRIMARY KEY (post_id, child_id)` y ambas FKs con `ON DELETE CASCADE`.
- [ ] `public.post_photos` tiene las 6 columnas del Data model con `position NOT NULL` y FK → `posts(id)` `ON DELETE CASCADE`.
- [ ] Exist los 6 índices del Data model (`posts_author_id_idx`, `posts_daycare_id_idx`, `posts_room_id_idx`, `posts_published_at_idx`, `post_children_child_id_idx`, `post_photos_post_id_idx`).
- [ ] `pg_policies` sobre `posts`: exactamente `posts_insert_staff_admin` (INSERT) y `posts_select_staff_parent` (SELECT), ambas `to authenticated`; ninguna de UPDATE/DELETE.
- [ ] El policy de INSERT exige `author_id = auth.uid()`, rol `staff`/`admin` y `daycare_id` = el del usuario.
- [ ] El policy de SELECT cubre: staff/admin de la misma daycare, padre por `post_children` ∩ `parent_children`, y padre por `room_id` de la sala de sus hijos.
- [ ] `post_children` y `post_photos` tienen SELECT `using (true)` e INSERT restringido a `staff`/`admin`.
- [ ] El bucket `post-photos` existe con `public = true`.
- [ ] `storage.objects` tiene INSERT solo staff/admin con el primer folder = `daycare_id` del usuario, DELETE solo staff/admin y SELECT público para el bucket.
- [ ] `select count(*) from public.posts` devuelve `0` (sin seeds).
- [ ] Los 3 archivos espejo en `supabase/migrations/` coinciden con las versiones de `supabase_migrations.schema_migrations`.
- [ ] `get_advisors(security)` no reporta hallazgos nuevos por estas tablas, policies o bucket.

## Decisions

- **Sí:** fix del vínculo `users` ↔ `auth.users` por migración (drop+re-add de FKs en transacción). **No:** lookup por email en cada Server Action (patrón frágil de SPEC 11, ya superado) ni trigger de sincronización (no hay más altas de usuarios sin `id = auth.uid()`).
- **Sí:** `posts.daycare_id` agregado sobre la referencia `@db-schema` (que no lo tiene). **No:** derivar el daycare del autor o de la sala en cada policy (scoping multi-tenant y path de storage necesitan la columna explícita; es la práctica estándar de tenant en Supabase).
- **Sí:** `mood` como séptimo valor del enum (la UI de SPEC 06 lo usa). **No:** los 6 valores de la referencia (rompería el pill ÁNIMO existente).
- **Sí:** RLS completo de las tablas de posts (INSERT por rol+autoría, SELECT por rol/audiencia). **No:** RLS permisivo `using (true)` de specs anteriores (el feed del padre exige filtrado real) ni políticas solo app-level (bypasseable con la publishable key).
- **Sí:** SELECT `using (true)` en `post_children`/`post_photos`. **No:** replicar el filtro del padre en ambas tablas (el bucket es público: las URLs de `post_photos` son leíbles sin sesión; restringir solo la tabla no protege nada y rompería los subqueries del policy de `posts`, que se evalúan con RLS del usuario actual). El contrato de visibilidad se cumple en `posts`.
- **Sí:** bucket público con lectura anónima. **No:** URLs firmadas (expirarían en el feed y complejizan el render; es un feed interno).
- **Sí:** policy de `DELETE` en `storage.objects` para staff/admin. **No:** sin DELETE (la limpieza best-effort de SPEC 13 fallaría en silencio y dejaría huérfanos).
- **Sí:** "Toda la sala" materializa `post_children` con los niños actuales **y** setea `room_id`; el filtro del padre incluye ambas ramas. **No:** solo `room_id` (los pads no tienen índice directo) ni solo `post_children` (un hijo que se anota después no vería anuncios de su sala).
- **Sí:** `post_photos.width`/`height` quedan nullable sin calcular en esta spec. **No:** leer dimensiones en cliente (la UI no las usa).
- **Sí:** sin seeds de posts. **No:** insertar los 3 posts mock de SPEC 01 en la BD (SPEC 13 elimina los mocks del feed; poblaría datos falsos en producción).
- **Nota:** esta spec deja explícitamente cumplido el ítem diferido de SPEC 11 (`FK users.id` → `auth.users.id`) y habilita el `author_id = auth.uid()` que SPEC 08/09 no podían usar.

## Risks

| Riesgo                                                                             | Mitigation                                                                                                                      |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Drop+re-add de FKs deja la BD sin constraints si la transacción falla a medias     | Todo dentro de un `begin/commit` único; verificación post-migración de existencia de ambas FKs (criterio explícito).            |
| `update users.id` rompe referencias no contempladas                                | Solo existen 2 FKs hacia `users` (`invitations.invited_by`, `parent_children.parent_id`); verificación de counts antes/después. |
| Policies de `posts` consultan `post_children` con RLS del usuario                  | `post_children` SELECT es `using (true)` para `authenticated` por diseño; documentado en Decisions.                             |
| Policy de INSERT en `storage.objects` depende de `users` (necesita SELECT)         | `users` ya tiene policy SELECT `to authenticated` desde SPEC 11; verificado con upload real en SPEC 13.                         |
| Un `users` sin fila en `auth.users` (email no matchea) quedaría con id sin linkear | No existe tal caso en los seeds (SPEC 08/09 crearon los auth users); la verificación cuenta filas sin match.                    |
| ` daycare_id` denormalizado en `posts` puede desincronizarse del autor             | La action de SPEC 13 siempre lo toma de la fila del usuario en sesión; el policy de INSERT exige coherencia.                    |

## What is **not** in this spec

- Seeds o datos iniciales en `posts`.
- Editar o eliminar posts (sin policies de UPDATE/DELETE).
- `reactions`, `comments`, `daily_summaries`, notificaciones.
- Multi-tenant por daycare en tablas distintas a `posts`.
- Atribución de fotos a niños; cálculo de dimensiones.
- La UI de publicación y el feed (SPEC 13).

Cada uno de esos, si llega, va en su propia spec.
