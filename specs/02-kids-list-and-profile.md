# SPEC 02 — Niños y perfil del niño (calco de ninos.dc.html y perfil-nino.dc.html)

> **Estado:** Implemented
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-23
> **Objetivo:** Implementar la lista de niños (`/kids`) y el perfil dinámico por id (`/kids/[id]`) como calcos de `ninos.dc.html` y `perfil-nino.dc.html`, con navegación funcional desde el sidebar y entre pantallas, sobre datos mock y sin autenticación.

## Scope

**In:**

- Página `/kids` en `app/kids/page.tsx`, calco de `references/pantallas/ninos.dc.html`: header `GESTIÓN` + `Niños` + botón `Agregar niño`, buscador `Buscar niño…` (visual), divisor `SALA SOLES · 8 niños`, grid de 8 tarjetas (2 columnas desktop, 1 en mobile) con nombre, `edad · vínculo de padres`, badge `MANÍ`/`LACTOSA`/`VINCULAR` o chevron.
- Página `/kids/[id]` en `app/kids/[id]/page.tsx`, calco de `references/pantallas/perfil-nino.dc.html`: `Volver a Niños`, hero con avatar, nombre y `3 años · Sala Soles`, botón `Editar`, banner `Alergias y notas`, filas `Fecha de nacimiento`/`Sala`/`Ingreso`, columna derecha con `Resumen del día` y tarjeta `PADRES VINCULADOS` (estado vacío cuando no hay padres).
- Datos mock de los 8 niños (datos de perfil inventados de forma coherente) en `app/_data/kids.ts`.
- Navegación real: tarjetas de niño → `/kids/[id]`, `Volver a Niños` → `/kids`, nav `Niños` → `/kids`, nav `Feed` y logo → `/` (desktop y drawer mobile).
- Estado activo del sidebar derivado de la URL: `Niños` resaltado en `/kids` y `/kids/[id]`; `Feed` resaltado en `/`.
- `notFound()` de Next.js para `/kids/[id]` con id inexistente.
- Integración con SPEC 01: se modifica `app/_data/mock.ts` (NavItem gana `href`) y `components/shared/Sidebar.tsx` (links reales + activo por pathname). El criterio de SPEC 01 "ningún link navega" queda limitado al contenido del feed; el sidebar deja de ser placeholder para logo/Feed/Niños.

**Out of scope (for future specs):**

- Pantallas `agregar-nino`, `vincular-padre`, `resumen-dia` (los botones que apuntan a ellas quedan visuales sin acción).
- Buscador funcional: el input es solo visual, no filtra.
- Autenticación, sesiones y base de datos ni ninguna forma de persistencia.
- Editar perfil, editar publicaciones, `Avisos`, `Mi cuenta`, logout.
- Subida de fotos o cambios reales en datos.

## Data model

Nuevo archivo `app/_data/kids.ts`:

```ts
export interface KidParent {
  name: string; // "Lucía Fernández"
  relation: "Mamá" | "Papá";
  status: "active" | "pending"; // → badge ACTIVA / PENDIENTE
  note: string; // "activa" | "invitación enviada"
  initial: string; // "L"
  avatarBg: string; // "#C9B6E8"
}

export interface Kid {
  id: string; // "1".."8" — coherente con FeedPost.id
  name: string; // "Mateo Fernández"
  initial: string; // "M"
  avatarBg: string; // "#A9D9E8"
  avatarColor: string; // "#1F7A93"
  ageYears: number; // 3
  room: string; // "Soles"
  birthDate: string; // "12 mar 2022"
  joinDate: string; // "feb 2025"
  allergies?: { badge: string; text: string }; // "MANÍ" + banner
  parents: KidParent[]; // [] → estado vacío
}

export const KIDS: Kid[];
export function getKidById(id: string): Kid | undefined;
```

Cambio en `app/_data/mock.ts` (SPEC 01):

```ts
export interface NavItem {
  label: string;
  icon: NavIcon;
  href: string; // "/" | "/kids" | "#"
  // active se elimina del dato: se deriva de usePathname()
}
```

Convenciones:

- Badge de tarjeta: si `allergies` existe → badge `{allergies.badge}` color `#FBD8CC`/`#D9684A`; si no y `parents.length === 0` → `VINCULAR` `#F9D2DE`/`#C56486`; si no → chevron. Regla única, sin datos duplicados.
- Texto secundario de tarjeta: `"{ageYears} años · {n} padres vinculados"`, singular `"1 padre vinculado"`, cero `"sin padres vinculados"`.
- Contador del divisor: `SALA SOLES` fijo + `{KIDS.length} niños`.
- Badge de padre: `status: "active"` → `ACTIVA` `#CFEBD8`/`#3E9B6C`; `"pending"` → `PENDIENTE` `#F7E7A6`/`#9A7B1E`.
- Datos de perfil de los 7 niños sin template: inventados de forma coherente (fechas, alergias y padres compatibles con sus badges del listado).

## Implementation plan

1. **Data mock.** Crear `app/_data/kids.ts` con `KidParent`, `Kid`, los 8 niños del template y `getKidById`. _Prueba: `npm run build` sin errores._
2. **Página de lista.** Crear `app/kids/page.tsx` y `components/kids/` (`KidsHeader`, `KidsSearch`, `KidsRoomLabel`, `KidCard`) con el calco de `ninos.dc.html` (contenedor `max-w-[880px]`, grid 2 col / 1 col en mobile). Tarjetas aún sin destino real (`href="#"`). _Prueba: abrir `/kids` y comparar contra el template y `references/screenshots/ninos.png`._
3. **Página de perfil.** Crear `app/kids/[id]/page.tsx` y `components/kid-profile/` (`ProfileBackLink`, `ProfileHero`, `AllergyBanner`, `ProfileFacts`, `ProfileAside`, `ParentsCard`) con el calco de `perfil-nino.dc.html` (`max-w-[820px]`). `params` es `Promise` en Next 16: resolver con `await` (verificar guía en `node_modules/next/dist/docs/`). Llamar `notFound()` si `getKidById` devuelve `undefined`. Estado vacío de padres: mensaje `Sin padres vinculados todavía` + botón `Vincular otro padre`. _Prueba: `/kids/1` calco correcto; `/kids/99` muestra el 404 de Next._
4. **Links entre pantallas.** `KidCard` navega con `next/link` a `/kids/${id}`; `ProfileBackLink` navega a `/kids`. _Prueba: click en cada tarjeta muestra el perfil de ese niño; `Volver a Niños` regresa a la lista._
5. **Sidebar navegable + activo.** Agregar `href` a `NAV_ITEMS` en `mock.ts` (logo `/`, Feed `/`, Niños `/kids`, Avisos `#`, Mi cuenta `#`). Convertir `SidebarContent` en client component con `usePathname()` para el estado activo; reemplazar `href="#"` por `next/link` solo en rutas reales. _Prueba: desde `/`, click en `Niños` llega a `/kids` (desktop y drawer); en `/kids` y `/kids/[id]` el item `Niños` aparece resaltado; `Feed` lleva a `/`._

## Acceptance criteria

- [x] `http://localhost:3000/kids` renderiza el calco de `ninos.dc.html`: header `GESTIÓN`/`Niños`/`Agregar niño`, buscador, `SALA SOLES · 8 niños`, grid con las 8 tarjetas (nombres, edades, textos de padres, badges `MANÍ`/`LACTOSA`/`VINCULAR` y chevrones del template).
- [x] `http://localhost:3000/kids/1` renderiza el calco de `perfil-nino.dc.html`: `Volver a Niños`, avatar `M`, `Mateo Fernández`, `3 años · Sala Soles`, `Editar`, banner de alergias, filas `12 mar 2022`/`Soles`/`feb 2025`, `Resumen del día`, padres Lucía `ACTIVA` y Diego `PENDIENTE`, `Vincular otro padre`.
- [x] Cada una de las 8 tarjetas navega a su propio `/kids/[id]` y muestra los datos de ese niño (no siempre el perfil de Mateo).
- [x] El perfil de Valentina Soto (`/kids/4`) muestra el estado vacío de padres con el mensaje y el botón `Vincular otro padre`.
- [x] `Volver a Niños` lleva a `/kids`.
- [x] Click en `Niños` del sidebar (desktop y drawer mobile) lleva a `/kids`; `Feed` y logo llevan a `/`.
- [x] En `/kids` y `/kids/[id]` el item `Niños` aparece activo (fondo `#FBE3D8`, texto `#D9583C`); en `/` sigue activo `Feed`.
- [x] `/kids/99` muestra el 404 nativo de Next.js.
- [x] `Agregar niño`, `Editar`, `Resumen del día`, `Vincular otro padre` y el buscador no navegan ni ejecutan acciones.
- [x] `Avisos`, `Mi cuenta` y logout siguen apuntando a `#`.
- [x] Las pantallas son responsive: el drawer hamburguesa funciona igual que en el home y el grid pasa a 1 columna en mobile.
- [x] `npm run lint` pasa sin errores.
- [x] `npx tsc --noEmit` pasa sin errores.
- [x] No hay errores en la consola del navegador al cargar `/`, `/kids` y `/kids/1`.

## Decisions

- **Sí:** rutas en inglés `/kids` y `/kids/[id]` (plural estándar + perfil anidado). **No:** `/kid` singular, menos convencional para un listado.
- **Sí:** archivo nuevo `app/_data/kids.ts`. **No:** ampliar `mock.ts` (mezcla feed con niños) ni datos inline en componentes.
- **Sí:** perfil dinámico por id con datos inventados para los 8 niños. **No:** calco estático siempre-Mateo (contradice los badges del listado).
- **Sí:** `href` en `NavItem` + activo derivado de `usePathname()` en `SidebarContent`. **No:** hardcodear `active` por página (error fácil al agregar pantallas) ni props por página (drilling innecesario).
- **Sí:** id numérico string `"1"`–`"8"`. **No:** slug legible en la URL (inconsistente con `FeedPost.id` y requiere slugificar acentos).
- **Sí:** `next/link` para rutas reales. **No:** `<a>` crudo (recarga la página).
- **Sí:** badge derivado de `allergies`/`parents` con regla única. **No:** guardar el badge como campo aparte (riesgo de divergencia).
- **Sí:** estado vacío de padres con mensaje + botón `Vincular`. **No:** ocultar la tarjeta (pierde la acción de vincular).
- **Sí:** `notFound()` de Next.js para id inválido. **No:** redirect a `/kids` (enmascara el error) ni UI 404 custom (código extra sin valor).
- **Sí:** controles secundarios y buscador visuales no funcionales, mismo criterio que SPEC 01. **No:** crear rutas futuras `/kids/new` fuera de alcance.
- **Sí:** grid 1 columna en mobile / 2 en ≥md. **No:** diseñar un mobile propio (el template no lo define; adaptación mínima).
- **Sí:** dejar constancia de que esta spec modifica el sidebar de SPEC 01 (logo/Feed/Niños dejan de ser placeholders). **No:** ignorar el cambio de comportamiento sobre una spec ya implementada.
- **Nota:** especificación desarrollada en dos bloques de preguntas y entregada completa para revisión directa en el chat.

## Risks

| Riesgo                                                                    | Mitigación                                                                                                    |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Esta spec cambia el sidebar de SPEC 01 y su criterio "ningún link navega" | Deja constancia en Decisions; solo cambian logo/Feed/Niños, el contenido del feed conserva sus placeholders.  |
| `params` es `Promise` en Next 16.3.6 (breaking change)                    | Verificar la guía en `node_modules/next/dist/docs/` antes de escribir `app/kids/[id]/page.tsx`.               |
| Datos inventados de 7 perfiles podrían contradecir los badges del listado | Badge derivado del dato con regla única; los 8 perfiles se revisan contra la tabla del template en el paso 1. |
| Convertir `SidebarContent` a client component puede romper el límite RSC  | `MobileNav` ya es client y lo importa; verificar home, `/kids` y drawer tras el paso 5.                       |

## What is **not** in this spec

- Pantallas `agregar-nino`, `vincular-padre` y `resumen-dia`.
- Buscador funcional (solo visual).
- Autenticación, sesiones y base de datos ni ninguna forma de persistencia.
- Editar perfil, `Avisos`, `Mi cuenta`, logout real.
- Cualquier botón fuera de los links navegables listados arriba.

Cada uno de esos, si llega, va en su propia spec.
