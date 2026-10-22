# Tasks

## 1. Extract del helper de feed

- [x] 1.1 Crear `app/_data/feed-query.ts` moviendo allí la query a `posts`, `PostRow`, `toFeedPost` y helpers (`avatarFor`, `formatTime`, `deriveAudience`, `firstName`, `AVATAR_PALETTE`) desde `app/page.tsx`, exportando `loadFeedPosts(supabase, sessionUserId): Promise<FeedPost[]>`. Verificar: `npx tsc --noEmit` limpio tras refactorizar `app/page.tsx` para consumir el helper (feed de `/` sigue funcionando igual hasta el move del task 2).

## 2. Árbol staff

- [x] 2.1 Mover `app/page.tsx` → `app/staff/page.tsx`, `app/kids/` → `app/staff/kids/` (page, actions, derive, `[id]`). Actualizar imports internos (`@/app/kids/derive`, `@/app/actions` si aplica) y `revalidatePath("/kids")` → `revalidatePath("/staff/kids")` en `app/staff/kids/actions.ts`. Verificar: `npx tsc --noEmit` limpio y `/staff` + `/staff/kids` renderizan con sesión de Alex.
- [x] 2.2 Crear `app/staff/layout.tsx`: server guard (sesión + query de rol por `auth.uid()`; `parent` → `redirect("/family")`), mueve `FeedProvider` + `CreatePostModal` desde `app/layout.tsx` (que queda solo con fonts/metadata), y renderiza el shell con sidebar staff + `MobileNav`. Verificar: con sesión de Alex, `/staff` muestra sidebar con `Nueva publicación`; forzar `/staff` con un JWT de parent (o simular el guard) redirige a `/family`; el modal no está montado fuera de `/staff`.
- [x] 2.3 Actualizar back-links y links rotos del árbol staff: `ProfileBackLink` y `LocalKidProfile` (`/kids` → `/staff/kids`). Verificar: desde `/staff/kids/[id]` el back link lleva a `/staff/kids`; `npm run lint` y `npx tsc --noEmit` limpios.

## 3. Árbol familia

- [x] 3.1 Crear `app/family/layout.tsx`: server guard (rol `staff`/`admin` → `redirect("/staff")`), sidebar familia (subtitle `Familia`, nav: Feed `/family`, Resumen del día `#`, Mi cuenta `#`, sin `showCompose`) + `MobileNav`. Verificar: con sesión de parent, el sidebar muestra los 3 items y no hay botón `Nueva publicación`; con sesión de Alex, `/family` redirige a `/staff`.
- [x] 3.2 Crear `app/family/page.tsx` consumiendo `loadFeedPosts` con el `sessionUserId` del padre (la RLS filtra la visibilidad). Verificar: con una cuenta de padre real (invitación SPEC 11), `/family` muestra solo posts de sus hijos + anuncios de sus salas; estado vacío se ve con 0 posts visibles; sin composer en la página (`npm run lint`, `npx tsc --noEmit`).

## 4. Router por rol y redirects

- [x] 4.1 Reescribir `app/page.tsx` como router por rol (server): claims → query `users` por `auth.uid()` → `redirect("/staff")` o `redirect("/family")`; sin fila → `/family`. Verificar: logueado como Alex, `/` aterriza en `/staff`; logueado como parent, `/` aterriza en `/family`; sin sesión, el proxy ya lleva a `/login`.
- [x] 4.2 `app/login/actions.ts`: tras `signInWithPassword`, resolver el rol y `redirect("/staff" | "/family")`. `app/activate-account/actions.ts`: `redirect("/family")`. Mantener `revalidatePath("/", "layout")`. Verificar: login de Alex → `/staff`; login de parent → `/family`; activación exitosa → `/family`; login con sesión activa en `/login` → su panel (guard + proxy).

## 5. Sidebar parametrizado

- [x] 5.1 Parametrizar `SidebarContent` con props `{ navItems, subtitle, showCompose, homeHref }`; extraer arrays de nav por panel (`STAFF_NAV_ITEMS`, `FAMILY_NAV_ITEMS`) y wrappers `StaffSidebar`/`FamilySidebar`; `isActivePath` usa `homeHref` para el case exacto del home. `MobileNav` acepta reutilizar el contenido parametrizado. Verificar: nav activo correcto en `/staff` (Feed) vs `/staff/kids` (Niños) vs `/family` (Feed); logo navega al home del panel; logout funciona en ambos paneles (desktop y drawer mobile); `npm run lint` y `npx tsc --noEmit` limpios.

## 6. Verificación de integración

- [x] 6.1 Suite manual completa con las dos sesiones: Alex (staff) recorre `/staff`, `/staff/kids`, `/staff/kids/[id]`, publica un post y lo ve en `/staff`; intenta `/family` → redirect a `/staff`. Parent recorre `/family`, ve solo sus posts, no ve composer, intenta `/staff` → redirect a `/family`. Sin sesión: `/`, `/staff`, `/family` → `/login`; `/login` y `/activate-account` responden. Verificar: consola sin errores ni warnings de hidratación en `/staff`, `/staff/kids` y `/family`; `npm run lint` y `npx tsc --noEmit` limpios.

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied (`/opsx-archive`).
- Verify the archived result.
