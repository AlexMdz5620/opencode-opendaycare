# Proposal

## Why

Hoy staff y familia comparten un único árbol de rutas (`/`, `/kids`) y un único sidebar: un padre que inicia sesión aterriza en el feed staff, ve el nav de staff (Niños, Avisos) y solo se le oculta el composer por rol. El diseño de referencia ya dibuja una zona familia con su propio sidebar y sus propias pantallas; falta materializar esa separación a nivel de rutas y shell.

## What Changes

- **BREAKING**: el staff se muda a `/staff/*` — el feed pasa de `/` a `/staff`, la lista de niños de `/kids` a `/staff/kids` y el perfil de `/kids/[id]` a `/staff/kids/[id]`.
- Árbol familia nuevo bajo `/family/*` con su propio shell: sidebar "Familia" (nav: Feed, Resumen del día `#`, Mi cuenta `#`) y sin composer ni botón de publicación. En este cambio solo se crea el feed de `/family` (server-side, filtrado por la RLS existente de posts); Resumen y Cuenta quedan como items `#` del nav (patrón actual de Avisos).
- Router por rol en `/`: sesión staff/admin → `/staff`; sesión parent → `/family`; sin sesión el proxy ya lleva a `/login`.
- Redirects post-login y post-activación por rol: `login` y `activateAccount` dejan de redirigir a `/` y resuelven el panel destino (`activateAccount` siempre `/family`, porque el flujo de invitación es de familias).
- Guards de UX por layout server: `app/staff/layout.tsx` redirige a un `parent` hacia `/family`; `app/family/layout.tsx` redirige a `staff`/`admin` hacia `/staff`. (La protección de datos sigue siendo RLS; el guard es de navegación.)
- `FeedProvider` + `CreatePostModal` se mueven del layout raíz al layout staff: el modal deja de existir en el árbol familia.
- Sidebar parametrizado: `SidebarContent` acepta items de nav, subtítulo y visibilidad del composer según el panel; `MobileNav` lo sigue reutilizando.
- Links internos actualizados: back-links de perfil de niño (`/kids` → `/staff/kids`), logo del sidebar (href por panel), `isActivePath` con case especial para `/staff`.
- `revalidatePath` de `createPost` y de las acciones de `/kids` apuntan a los paths nuevos (`/staff`, `/staff/kids`).

## Capabilities

### New Capabilities

- `role-based-routing`: aterrizar en el panel correcto según rol — redirect de `/`, redirect post-login/post-activación, y guards de acceso cruzado entre `/staff/*` y `/family/*`.
- `staff-panel`: shell del panel staff — árbol `/staff/*` (feed, lista y perfil de niños), sidebar con composer y nav staff, y gating de acciones de publicación por rol.
- `family-panel`: shell del panel familia — árbol `/family/*`, sidebar "Familia" sin publicación, y feed de familia (solo posts visibles vía RLS: hijos propios + anuncios de sus salas).

### Modified Capabilities

<!-- Ninguna: openspec/specs está vacío; las specs legacy en specs/ son la historia previa del proyecto, no capacidades del sistema OpenSpec. -->

## Impact

- **Rutas (BREAKING)**: `app/page.tsx` → `app/staff/page.tsx`; `app/kids/**` → `app/staff/kids/**`; nuevos `app/staff/layout.tsx`, `app/family/layout.tsx`, `app/family/page.tsx`; `app/page.tsx` pasa a ser router por rol.
- **Actions**: `app/login/actions.ts`, `app/activate-account/actions.ts` (redirects por rol), `app/actions.ts` y `app/kids/actions.ts` (`revalidatePath`).
- **Componentes**: `components/shared/Sidebar.tsx` y `MobileNav.tsx` (parametrización), `components/kid-profile/ProfileBackLink.tsx` y `LocalKidProfile.tsx` (links), `app/layout.tsx` (queda sin FeedProvider/CreatePostModal).
- **Helper nuevo**: extracción de la query + mapeo a `FeedPost` (hoy en `app/page.tsx`) a un helper compartido para staff y family.
- **Sin cambios de DB/RLS**: la separación de datos ya la hace la política `posts_select_staff_parent` (SPEC 12).
- **proxy.ts**: sin cambios de guards por rol (queda como mejora futura); el matcher y PUBLIC_PATHS se mantienen.
