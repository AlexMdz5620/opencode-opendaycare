# SPEC 13 — Publicación de entradas por staff con fotos reales y feed desde BD

> **Estado:** Approved
> **Depende de:** SPEC 01, SPEC 06, SPEC 09, SPEC 10, SPEC 11, SPEC 12
> **Fecha:** 2026-10-20
> **Objetivo:** Que el staff y el admin publiquen entradas desde el modal existente (con título opcional y hasta 5 fotos reales subidas a Storage), que el post persista en `posts` con su audiencia materializada, y que el feed de `/` lea desde BD filtrando por RLS: el staff ve su daycare y el padre ve solo a sus hijos y los anuncios de sus salas.

## Scope

**In:**

- `components/shared/useSessionUser.ts`: `SessionUser` gana el campo `role: string` (rol de `public.users`, vacío si no hay fila). `roleLabel` sin cambios.
- Gating de UI para `parent`: el `Composer` (`Compartí un momento…`) y el botón `Nueva publicación` del `Sidebar` (desktop) y del drawer mobile (`MobileNav`) no se renderizan con rol `parent`. El modal en sí no cambia su montaje global.
- `components/home/FeedContext.tsx` se reduce al estado del modal: `isCreateOpen`, `openCreate`, `closeCreate`. Se eliminan `posts` y `addPost` (el feed ya no vive en el contexto).
- `app/page.tsx` (server) consulta los posts visibles para la sesión con `utils/supabase/server.ts`: `posts` join `users` (autor) + `post_photos` (orden `position`) + `post_children` join `children` (nombres de audiencia) + `rooms` (nombre de sala), orden `published_at desc`. Deriva `FeedPost[]` y los pasa como prop a `FeedScreen`. El `users.id` de la sesión se resuelve por `auth.uid()` (SPEC 12) y marca `publishedByMe`.
- `components/home/FeedScreen.tsx` recibe `posts` y `currentUserId` por props y renderiza la lista; estado vacío `Todavía no hay publicaciones. Sé el primero en compartir un momento.` cuando `posts.length === 0` (sin divisor `PUBLICADO HOY`).
- Los mocks `POSTS` de `app/_data/mock.ts` quedan **desconectados** del feed (el archivo se mantiene intacto con sus tipos, labels y order — patrón SPEC 10). El feed empieza vacío hasta que el staff publique.
- `components/home/CreatePostModal.tsx`:
  - Al montar el diálogo carga con el browser client: `rooms` (orden `created_at`) y `children` (`status = 'active'`, orden `full_name`) incluyendo `photo_consent` y `room_id`. Dejan de usarse `KIDS` de `app/_data/kids.ts` y `loadLocalKids()`.
  - Sección `PARA`: una pill de sala por cada sala de BD, sin avatar, label `Toda la sala · {sala}`; y una pill por niño con su inicial. Exclusividad: marcar una sala desmarca todos los niños y las demás salas; con una sala marcada, clickear un niño lo selecciona a él y desmarca la sala; con niños marcados, clickear una sala desmarca los niños. Arranca con nada seleccionado.
  - Sección `Título (opcional)`: input de texto sobre `DESCRIPCIÓN`, arranca vacío; vacío es válido.
  - Validaciones de `Publicar`: las 3 de SPEC 06 (audiencia, tipo, descripción) + fotos: máximo 5, cada una `image/*` y ≤ 5 MB. Errores nuevos: `Máximo 5 fotos`, `Cada foto debe pesar menos de 5 MB`, `Solo se pueden adjuntar imágenes`.
  - Bloqueo por `photo_consent`: si hay fotos adjuntas y la audiencia incluye al menos un niño con `photo_consent = false` (niños seleccionados individualmente, o cualquier niño activo de la sala marcada), no publica y muestra `Hay niños sin consentimiento de fotos en la audiencia. Quitá las fotos o publicalas sin ellas.`
  - El estado de fotos pasa a `{ file: File; previewUrl: string }[]` (el `File` viaja a la action; el `previewUrl` es el object URL para el preview, revocado al quitar o cancelar).
  - `Publicar` llama a la Server Action `createPost` con `useActionState` (patrón SPEC 09/10); en éxito cierra y limpia el estado; en error muestra el mensaje inline bajo `FOTOS` sin cerrar.
- Server Action `createPost(prevState, formData)` en `app/actions.ts` (nuevo, `"use server"`):
  - Resuelve la sesión (`auth.getClaims()` / `getUser`) y la fila `users` por `auth.uid()`; sin sesión, rol distinto de `staff`/`admin` o sin fila → error `No se pudo publicar. Intentá de nuevo.`
  - Valida servidor: tipo ∈ `post_type`, descripción no vacía, audiencia válida (sala existente del daycare, o ≥1 kid id), ≤5 fotos, cada una `image/*` y ≤5 MB, y el bloqueo `photo_consent` (misma regla que el cliente, re-chequeada).
  - Genera `post_id = crypto.randomUUID()`; sube cada archivo a `post-photos/{daycare_id}/{post_id}/{posición}-{uuid}.{ext}` con el server client (RLS de SPEC 12 aplica) y obtiene la URL pública.
  - Inserta `posts` (`author_id = auth.uid()`, `daycare_id` del usuario, `room_id` si es post de sala, `title` nullables, `body`, `type`), `post_children` (en modo sala: **todos** los niños activos de esa sala; en modo kids: solo los seleccionados) y `post_photos` (`url`, `position` 0..n-1). Sin transacción: si falla el insert tras subir archivos, hace limpieza best-effort (`remove`) de los archivos subidos y devuelve error.
  - En éxito: `revalidatePath("/")` y `{ success: true }`.
  - Estado: `interface CreatePostState { error?: string; success?: boolean }`.
- `components/home/PostCard.tsx`: si `post.title` existe, se renderiza en negrita sobre el texto (mismo cuerpo de tarjeta); sin título no cambia nada. Los campos `hearts`/`comments` siguen en `0` (UI existente, sin funcionalidad).
- Derivación server-side de audiencia para el feed: post de sala → `Para: sala {room_name}`; post de niños → `Para: familia de {nombres propios}` (un niño: `Para: familia de Mateo`; varios: `Para: familia de Mateo, Sofía` — misma regla de SPEC 06).
- Avatar del autor en `PostCard`: paleta rotativa por índice (5 combos ya usados en SPEC 04) sobre `authorId`, ya que `users` no tiene colores de avatar.

**Out of scope (for future specs):**

- Editar o eliminar posts publicados (`Editar` sigue siendo visual).
- Notificaciones al publicar (`notify_on_post` queda sin disparar).
- Feed en tiempo real (actualiza con `revalidatePath` y al navegar; sin canales Realtime).
- Comentarios y reacciones funcionales.
- Resumen diario por niño.
- Compresión/redimensión de fotos en cliente (se suben tal cual con el límite de 5 MB).
- Drag&Drop de fotos (decisión de SPEC 06, se mantiene).
- UI para gestionar `photo_consent` (la columna la setea el staff por SQL/otra spec).
- Borrar los archivos `app/_data/kids.ts`, `localKids.ts` o `POSTS` (solo se desconectan).
- Feed de familias como pantalla propia, detalle de publicación, compartir con salas de otra daycare.

## Data model

Tipos nuevos/ajustados:

```ts
// components/shared/useSessionUser.ts
export interface SessionUser {
  name: string;
  initial: string;
  roleLabel: string;
  role: string; // "staff" | "admin" | "parent" | ""
}

// components/home/CreatePostModal.tsx
interface PhotoEntry {
  file: File;
  previewUrl: string; // object URL para el preview
}

// app/actions.ts
export interface CreatePostState {
  error?: string;
  success?: boolean;
}

// formData de createPost
// type: PostType; body: string; title?: string;
// audienceMode: "room" | "kids"; roomId?: string; kidIds: string (uuid repetido);
// photos: File[] (entries múltiples del input)
```

`FeedPost` (en `app/_data/mock.ts`, sin romper los mocks existentes) gana campos para el mapeo real:

```ts
export interface FeedPost {
  // …campos existentes de SPEC 06…
  authorId?: string; // para publishedByMe en el server
  title?: string;
  // photos: string[] — ahora URLs públicas de Storage (antes object URLs)
}
```

Mapeo fila → `FeedPost` (en `app/page.tsx`):

- `authorName` = `users.full_name`; `avatarBg`/`avatarColor` = paleta rotativa por índice.
- `time` = `published_at` en `HH:MM` (mismo formato que el mock).
- `publishedByMe` = `author_id === sessionUserId`.
- `text` = `body`; `title` = `title` (nullable).
- `photos` = urls de `post_photos` ordenadas por `position` (vacío → `undefined`).
- `audience` = regla de arriba; se excluye `children.full_name` de niños sin `photo_consent` **solo si el post no tiene fotos** — no: la audiencia se muestra completa siempre (los nombres no son fotos).
- `type` = columna `type` (los valores calzan con `PostType`).

Convención de path Storage: `post-photos/{daycare_id}/{post_id}/{posición}-{uuid}.{ext}`.

## Implementation plan

1. **Rol en sesión.** Agregar `role` a `useSessionUser` (select `full_name, role`). _Prueba: `npx tsc --noEmit` limpio; el label no cambia._
2. **Feed desde BD.** Query server en `app/page.tsx` + mapeo a `FeedPost[]` + estado vacío; `FeedScreen` recibe `posts` y `currentUserId` por props y deja de leer el contexto. El modal aún usa `addPost` (en memoria): un post nuevo se ve hasta recargar. _Prueba: `/` sin sesión → `/login`; con sesión de Alex, feed vacío con el estado vacío; recargar no trae mocks._
3. **Contexto liviano.** Quitar `posts`/`addPost` de `FeedContext`; `CreatePostModal` deja de llamar `addPost` (solo valida y cierra en esta transición). _Prueba: `npx tsc --noEmit` limpio; abrir/cerrar el modal no rompe._
4. **Gating.** Composer y botón `Nueva publicación` (sidebar + drawer) condicionados a `role` `staff`/`admin`. _Prueba: con sesión de un padre activado, `/` no muestra composer ni botón y el modal no abre._
5. **PARA desde BD.** Carga de `rooms` + `children` al montar el diálogo; pills de sala `Toda la sala · {sala}` + pills de niño; exclusividad; quitar `KIDS` y `loadLocalKids`. _Prueba: con 3 salas y niños creados en SPEC 10, las pills listan solo niños activos; la exclusividad funciona en ambos sentidos._
6. **Título y validaciones.** Input `Título (opcional)`; límites de fotos (5 / 5 MB / `image/*`) y bloqueo `photo_consent` en cliente. _Prueba: la 6ª foto muestra `Máximo 5 fotos`; un .txt no adjunta; con un niño sin consentimiento y fotos, no publica y muestra el mensaje._
7. **Server Action.** `app/actions.ts` con `createPost`: validaciones server, uploads, inserts, limpieza best-effort, `revalidatePath("/")`. _Prueba: `npx tsc --noEmit` limpio._
8. **Publicar real.** `CreatePostModal` conectado con `useActionState(createPost, …)`; previews con `PhotoEntry`; cierre en éxito; error inline en fracaso. _Prueba: publicar con `Toda la sala · Soles` y 2 fotos → la action inserta `posts` + 2+ filas `post_children` + 2 `post_photos`; recargar mantiene el post con fotos visibles._
9. **PostCard.** Título en negrita si existe; autor real con paleta; audiencia `Para: sala Soles` / `Para: familia de …`. _Prueba: los 3 formatos (con título, sin título, sala vs kids) se ven correctos._
10. **Cierre.** _Prueba: `npm run lint`, `npx tsc --noEmit`, consola limpia en `/` y `/kids`; con una cuenta de padre real (invitación SPEC 11), el feed del padre solo muestra posts de sus hijos + `Para: sala …` de sus salas, y no hay composer._

## Acceptance criteria

- [ ] `SessionUser` expone `role`; el resto de consumidores de `useSessionUser` siguen compilando.
- [ ] Con sesión de `parent`, `/` no renderiza el composer ni el botón `Nueva publicación` (desktop ni drawer mobile).
- [ ] Con sesión de `staff`/`admin`, composer y botón se ven y abren el modal.
- [ ] `/` con sesión renderiza el feed desde BD; sin sesión redirige a `/login`.
- [ ] Con 0 posts, el feed muestra `Todavía no hay publicaciones. Sé el primero en compartir un momento.` sin divisor `PUBLICADO HOY`.
- [ ] Los mocks `POSTS` no se pintan en el feed aunque existan en `app/_data/mock.ts`.
- [ ] `FeedContext` ya no expone `posts` ni `addPost` (solo estado del modal).
- [ ] El modal lista salas de BD como pills `Toda la sala · {sala}` (orden de inserción) y niños activos con su inicial.
- [ ] La exclusividad de `PARA` funciona: marcar sala desmarca niños; clickear niño con sala activa desmarca la sala y lo selecciona a él; marcar otra sala cambia la sala.
- [ ] Existe el campo `Título (opcional)`; publicar con título vacío es válido.
- [ ] `Publicar` con audiencia, tipo o descripción vacíos muestra `Este campo es obligatorio` y no cierra (comportamiento SPEC 06 intacto).
- [ ] La 6ª foto muestra `Máximo 5 fotos`; un archivo no imagen muestra `Solo se pueden adjuntar imágenes`; un archivo >5 MB muestra `Cada foto debe pesar menos de 5 MB`; ninguno de los tres publica.
- [ ] Con fotos y audiencia que incluye un niño con `photo_consent = false`, `Publicar` muestra el mensaje de consentimiento, no sube nada ni inserta nada (verificable con `execute_sql`: 0 filas nuevas).
- [ ] Publicar sin fotos funciona (post con `photos` vacío).
- [ ] Tras publicar, recargar `/` mantiene el post con autor, hora, tipo, audiencia y fotos reales (viene de la BD y Storage).
- [ ] El post de sala inserta `room_id` y una fila `post_children` por cada niño activo de esa sala (`execute_sql`).
- [ ] El post de kids inserta `room_id` null y `post_children` solo con los niños elegidos.
- [ ] Los archivos en el bucket siguen la convención `{daycare_id}/{post_id}/{posición}-{uuid}.{ext}` y las URLs públicas renderizan en `PostCard`.
- [ ] El título, cuando existe, se muestra en negrita sobre el cuerpo del post; sin título, la tarjeta es idéntica a SPEC 06.
- [ ] `Para: sala Soles` para post de sala; `Para: familia de Mateo` (1) y `Para: familia de Mateo, Sofía` (2+) para posts de niños.
- [ ] Con una cuenta de padre real (activada por invitación), el feed muestra solo: posts que incluyen a sus hijos en `post_children` + posts `room_id` de las salas de sus hijos; no ve posts de otros niños ni de otras salas.
- [ ] Un `parent` no puede abrir el modal por UI y, si la action se invocara directamente, `createPost` devuelve error (RLS + validación de rol).
- [ ] Cerrar con `Cancelar`/`Esc`/fondo revoca los previews y no inserta nada; reabrir arranca vacío.
- [ ] Un fallo de insert posterior al upload deja el feed sin post y (best-effort) borra los archivos subidos.
- [ ] `npm run lint` pasa sin errores.
- [ ] `npx tsc --noEmit` pasa sin errores.
- [ ] No hay errores ni avisos de hidratación en la consola de `/` y `/kids`.

## Decisions

- **Sí:** feed con props server (`app/page.tsx` consulta y deriva) + `revalidatePath("/")` tras publicar. **No:** posts en `FeedContext` (el provider vive en el layout y no refresca server-side) ni consulta con browser client (estado de carga visible y patrón ya abandonado en SPEC 10).
- **Sí:** el modal carga `rooms`/`children` al abrir con browser client. **No:** prop-drill desde `layout.tsx` (el layout no tiene los datos y el fetch solo hace falta cuando el modal está abierto).
- **Sí:** upload dentro de la Server Action con `FormData` + `File` (una sola llamada, RLS del usuario real). **No:** upload directo del browser y action solo para filas (dos puntos de fallo y URLs sin validar server-side).
- **Sí:** una pill de sala por sala (`Toda la sala · {sala}`). **No:** una sola pill `Toda la sala` (SPEC 06 asumía una sala; ahora hay 3 reales y hay que elegir) ni dropdown separado (rompe el calco de pills).
- **Sí:** label de audiencia `Para: sala {sala}`. **No:** `Para: toda la sala` (con varias salas no dice cuál).
- **Sí:** bloqueo `photo_consent` en cliente **y** servidor. **No:** solo cliente (bypasseable) ni ignorar el consentimiento (riesgo legal real en una app de guardería).
- **Sí:** título opcional en el modal (columna `title` de SPEC 12). **No:** sin campo de título (la columna quedaría huérfana y los anuncios pierden contexto).
- **Sí:** fotos sin compresión, con límite 5 MB y 5 archivos validados en cliente y servidor. **No:** resize en canvas (agrega fallos de formato/EXIF al flujo crítico) — si el storage crece, va en spec propia.
- **Sí:** mocks `POSTS` desconectados sin borrar el archivo (patrón SPEC 10). **No:** fallback a mocks (ocultaría el estado vacío real) ni borrar `mock.ts` (los tipos y labels se siguen usando).
- **Sí:** `post_children` materializado al publicar en modo sala + filtro del padre con rama `room_id`. **No:** solo room (el índice del padre es por hijos) ni solo children (un hijo nuevo no vería anuncios pasados de su sala).
- **Sí:** `createPost` en `app/actions.ts` (raíz junto a `app/page.tsx`). **No:** `app/home/actions.ts` (no existe carpeta home) ni dentro de `components/`.
- **Sí:** limpieza best-effort de archivos si falla el insert. **No:** transacción imposible (Storage no participa de la transacción de Postgres).
- **Sí:** los criterios de SPEC 06 sobre "recargar borra los posts" y "autor Caro Giménez" quedan **reemplazados** por esta spec (mismo precedente que SPEC 10 con SPEC 02/04). **No:** mantener dos feed.
- **Fuera confirmado por el usuario (grilling):** editar/eliminar, notificaciones, realtime, comentarios/reacciones, resumen diario, compresión.

## Risks

| Riesgo                                                                                          | Mitigation                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.uid()` para el staff solo funciona tras el fix de SPEC 12                                 | SPEC 12 es dependencia dura; la action resuelve `users` por `auth.uid()` y falla con mensaje claro si no hay fila.                                                                                                                                                                                      |
| Un padre podría insertar `post_children` apuntando a hijos ajenos (RLS de INSERT solo pide rol) | La action solo acepta kids del daycare del usuario y el policy de `posts` exige `author_id = auth.uid()` con rol staff; el SELECT del feed del padre sigue filtrado por `parent_children`. Riesgo residual registrado: endurecer `post_children` con subquery de daycare va en la spec de multi-tenant. |
| Materializar `post_children` con muchos niños alarga la action                                  | Salas pequeñas (≤ decenas); si crece, migrar a RPC en spec futura.                                                                                                                                                                                                                                      |
| `revalidatePath("/")` solo refresca la ruta actual                                              | El feed es la raíz; al navegar a `/kids` y volver, el server component reconsulta igual.                                                                                                                                                                                                                |
| Upload de 5 archivos pesados satura el límite de body de la action                              | Validación de 5 MB por archivo antes de subir; límite total asumible (~25 MB).                                                                                                                                                                                                                          |
| Hidratación con fotos/autor del server vs estado previo del contexto                            | El contexto ya no guarda posts; el estado inicial del feed viene 100 % de props del server.                                                                                                                                                                                                             |

## What is **not** in this spec

- Editar, eliminar o reaccionar a posts.
- Notificaciones, realtime, comentarios, resumen diario.
- Compresión de fotos ni Drag&Drop.
- UI de `photo_consent`; atribución de fotos a niños.
- Borrar los archivos mock (`POSTS`, `kids.ts`, `localKids.ts`).
- Feed propio de familias, detalle de publicación, multi-daycare.

Cada uno de esos, si llega, va en su propia spec.
