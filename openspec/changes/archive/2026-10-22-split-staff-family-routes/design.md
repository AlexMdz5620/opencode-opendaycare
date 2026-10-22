# Design

## Context

La app es Next.js 16 (App Router) con Supabase (`@supabase/ssr`). El proxy (`utils/supabase/proxy.ts`) solo refresca tokens y protege contra anónimos: no conoce el rol porque este vive en `public.users`, no en el JWT. El rol se resuelve hoy en cliente con `useSessionUser` (query a `users` por email) y en server con una query por `auth.uid()` (patrón ya usado en `app/actions.ts` / `createPost`).

El feed server ya existe en `app/page.tsx`: query a `posts` con joins (autor, fotos, audiencia, sala) + mapeo a `FeedPost[]`. La RLS `posts_select_staff_parent` (SPEC 12) ya filtra por rol: staff ve su daycare, el padre ve posts de sus hijos y anuncios de sus salas — el filtrado de datos no necesita lógica nueva.

`FeedProvider` + `CreatePostModal` están montados en `app/layout.tsx` (raíz). `SidebarContent` es un único componente con `NAV_ITEMS` mock y un `canPublish` por rol. No hay layouts intermedios: cada pantalla (`FeedScreen`, `KidsScreen`, perfil) monta su propio `Sidebar` + `MobileNav`.

Ver proposal.md por la motivación y specs/ por los requisitos observables.

## Goals / Non-Goals

**Goals:**

- Árbol de rutas `/staff/*` y `/family/*` con shells independientes (sidebar y layout propios).
- Aterrizaje por rol en login, activación y raíz.
- Guards de UX por layout server para acceso cruzado.
- Reutilizar la lógica de feed existente (query + mapeo) en ambos paneles.
- Mover `FeedProvider`/`CreatePostModal` al árbol staff para que no existan en familia.

**Non-Goals:**

- Filtros por hijo, "Resumen del día", "Mi cuenta" y "Avisos" como pantallas (quedan como items `#` del nav y specs futuras).
- Guard por rol en `proxy.ts` (middleware): requiere query al DB por request o claims custom; queda como mejora futura.
- Cambios de esquema, RLS o Edge Functions.
- Editar/eliminar posts, comentarios, reacciones.

## Decisions

### 1. Guards por layout server, no por proxy

**Decisión**: `app/staff/layout.tsx` y `app/family/layout.tsx` son server components que resuelven la sesión (`auth.getClaims`/`getUser`) + la fila `users` por `auth.uid()` y redirigen con `redirect()` si el rol no corresponde al panel.

**Por qué**: el proxy no tiene el rol sin una query por request (costo en cada asset/navigation) o sin mover el rol a `app_metadata` (cambio en Auth con trigger o en cada login). El guard por layout corre una sola vez por request de página, que es donde importa la UX. La seguridad real la da RLS, ya probada en SPEC 12/13.

**Alternativa descartada**: guard en proxy con query a `users` — más latencia por request sin beneficio de seguridad (RLS ya cubre los datos).

### 2. `/` como router por rol mínimo

**Decisión**: `app/page.tsx` queda como server component mínimo: sin sesión → el proxy ya redirige a `/login`; con sesión → query de rol → `redirect("/staff" | "/family")`; sin fila en `users` → `/family`.

**Por qué**: los usuarios existentes tienen bookmarks en `/`; sin este router recibirían 404. `/family` es el panel de menor privilegio para un usuario sin rol claro.

**Alternativa descartada**: que el proxy maneje `/` — mismo problema de costo del decision 1.

### 3. Extract de la query de feed a un helper compartido

**Decisión**: mover la query a `posts` + el mapeo `toFeedPost` (con sus helpers `avatarFor`, `formatTime`, `deriveAudience`, `firstName`, `AVATAR_PALETTE`) de `app/page.tsx` a `utils/feed.ts` (o `app/_data/feed-query.ts`; ver Open Questions). Ambos `page.tsx` (staff y family) lo consumen pasando el `sessionUserId`.

**Por qué**: la query y el shape de `FeedPost` son idénticos para ambos paneles; la visibilidad la filtra RLS, no el query builder. Duplicar el mapeo garantiza divergencia.

### 4. Sidebar parametrizado, no dos componentes

**Decisión**: `SidebarContent` acepta props `{ navItems, subtitle, showCompose }` (y `homeHref` implícito por panel). Se crean dos wrappers ligeras: `StaffSidebar` y `FamilySidebar`, que pasan su configuración. `MobileNav` recibe el contenido ya configurado (los wrappers se pasan como children o `MobileNav` acepta children).

**Por qué**: comparte el footer de sesión, logout, estilos y el drawer mobile; solo cambian nav/subtítulo/composer. Dos componentes copy-paste divergirían en logout y estilos.

**Configuración por panel**:

| Prop | Staff | Family |
|---|---|---|
| subtitle | `Sala Soles` (o nombre de daycare) | `Familia` |
| navItems | Feed `/staff`, Niños `/staff/kids`, Avisos `#`, Mi cuenta `#` | Feed `/family`, Resumen del día `#`, Mi cuenta `#` |
| showCompose | `true` | `false` |
| homeHref | `/staff` | `/family` |

`NAV_ITEMS` mock en `app/_data/mock.ts` deja de ser la fuente única; los arrays de items por panel viven junto a los wrappers.

### 5. `FeedProvider` y `CreatePostModal` se mudan al layout staff

**Decisión**: `app/layout.tsx` queda solo con fonts/metadata; `app/staff/layout.tsx` monta `FeedProvider` + `children` + `CreatePostModal`.

**Por qué**: el estado del modal (`isCreateOpen`) y el modal mismo son exclusivos del staff. Con esto, cualquier ruta `/family/*` queda libre del modal sin condiciones extra.

### 6. `isActivePath` y case especial `/staff`

**Decisión**: en `SidebarContent`, el case especial `href === "/"` pasa a comparar contra el `homeHref` del panel (exact match); el resto sigue con `startsWith`.

**Por qué**: `/` ya no es el feed; `/staff` debe ser "activo" solo en `/staff`, no en `/staff/kids` (ese es de Niños).

### 7. `revalidatePath` apunta a los paths nuevos

**Decisión**: `createPost` → `revalidatePath("/staff")`; acciones de kids → `revalidatePath("/staff/kids")`; `login`/`activateAccount` → `revalidatePath("/", "layout")` se mantiene (refresca el router por rol).

## Risks / Trade-offs

- [El guard por layout no bloquea fetch directo a Rutas staff por un padre (solo UX)] → La RLS ya impide leer datos ajenos; el spec lo declara explícitamente (requirement "Guards do not replace RLS"). Mitigación futura: guard en proxy.
- [Mover archivos rompe imports internos (`@/app/kids/...`, `@/app/actions`)] → Actualizar imports en la misma tarea que mueve cada archivo; `npx tsc --noEmit` como red.
- [Dos sidebars pueden divergir en el footer/logout] → Un solo `SidebarContent` parametrizado; wrappers delgados.
- [Padres con sesión abierta antes del cambio aterrizarían en `/` que ahora redirige] → El router por rol en `/` los lleva a `/family` automáticamente.
- [El logo y back-links quedan con paths viejos y generan 404] → Checklist de links en tasks: `ProfileBackLink`, `LocalKidProfile`, logo sidebar, `LoginForm` (`/login` no cambia).

## Migration Plan

Deploy atómico en un solo PR: no hay datos que migrar ni URLs con SEO. Rollback = revert del PR. Los usuarios no requieren re-login (las cookies de sesión no cambian).

Orden sugerido (detallado en tasks.md):

1. Helper de feed extract + move de rutas staff + layouts con guards.
2. Árbol family (layout + page).
3. Router `/` + redirects de login/activación.
4. Sidebar parametrizado y limpieza de imports/links.

## Open Questions

- **Ubicación del helper de feed**: `utils/feed.ts` vs `app/_data/feed-query.ts`. Irrelevante para specs y tasks (el task dice "helper compartido"); se resuelve al implementar según convención del repo (hoy `utils/` es para Supabase, `app/_data/` para mocks/tippos de datos).
