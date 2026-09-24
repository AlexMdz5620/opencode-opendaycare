# SPEC 04 — Modal de alta de niño con guardado en localStorage (calco de agregar-nino.dc.html)

> **Estado:** Approved
> **Depende de:** SPEC 02
> **Fecha:** 2026-09-24
> **Objetivo:** Agregar niños desde un modal calco de `agregar-nino.dc.html` abierto por el botón `Agregar niño` de `/kids`, persistiéndolos en `localStorage` y agrupando la lista por sala con secciones plegables, sin backend.

## Scope

**In:**

- Modal `AddKidModal` en `components/kids/AddKidModal.tsx`, calco de `references/pantallas/agregar-nino.dc.html` dentro de una tarjeta centrada sobre fondo oscuro: cabecera `Cancelar` · `Agregar niño` · `Guardar` y los 5 campos (`NOMBRE COMPLETO`, `FECHA DE NACIMIENTO`, `SALA`, `ALERGIAS (ETIQUETAS)`, `NOTAS MÉDICAS`) con sus placeholders.
- Obligatorios: nombre, fecha y sala. Alergias y notas son opcionales.
- Apertura desde el botón `Agregar niño` de `components/kids/KidsHeader.tsx` (deja de ser `Link href="#"` y pasa a `<button>`); cierre con `Cancelar`, `Esc` o click en el fondo, descartando cambios; al reabrir arranca vacío.
- Validación al pulsar `Guardar`: si falta alguno de los 3 obligatorios no se guarda ni se cierra, y cada campo muestra borde rojo `#D9583C` + mensaje `Este campo es obligatorio`.
- `SALA` es un `<select>` con las opciones del arreglo `ROOMS` (`Soles`, `Lunas`, `Estrellas`), por defecto `Soles`.
- Persistencia en `localStorage` con la clave `openDaycare:kids:v1`, solo con los niños creados en esta spec. `app/_data/kids.ts` no se modifica ni se elimina.
- Fusión en `/kids`: los 8 mock + los locales, agrupados por `ROOMS` en orden, cada sala en su propia sección con divisor `SALA X · N niños` (singular `1 niño`), plegable con flecha, todas expandidas por defecto, salas sin niños ocultas, contador por sala incluyendo los locales.
- `KidsRoomLabel` deja de leer `KIDS` y recibe `room` y `count` por props.
- Perfil `/kids/[id]` extendido para los niños locales: fecha de nacimiento y sala reales, `Ingreso` = mes de creación, banner de alergias solo si hay etiquetas, `PADRES VINCULADOS` en el estado vacío que ya existe; `Editar` y `Resumen del día` siguen visuales.
- Derivación automática de `initial`, `ageYears`, `joinDate`, `parents: []`, `avatarBg`/`avatarColor` y badge de alergias (primera etiqueta en mayúsculas).
- Fallback en memoria: si `localStorage` falla (modo privado), el alta sigue funcionando durante la sesión sin lanzar excepciones.

**Out of scope (for future specs):**

- Backend, API, base de datos o cualquier forma de sincronización.
- Editar o eliminar niños creados en `localStorage`.
- Buscador funcional (sigue siendo visual).
- Vincular padres desde el modal o editar el perfil.
- Reflejar los niños nuevos en el feed/home de SPEC 01.
- Sistema de toasts o notificaciones.
- Subida de fotos o cambios en datos mock.
- Migración de esquema más allá de la clave versionada `:v1`.

## Data model

Nuevo archivo `app/_data/rooms.ts`:

```ts
export const ROOMS = ["Soles", "Lunas", "Estrellas"] as const;
export type Room = (typeof ROOMS)[number];
```

Nuevo archivo `app/_data/localKids.ts` (no toca `app/_data/kids.ts`):

```ts
export const LOCAL_KIDS_KEY = "openDaycare:kids:v1";

// Lo que se persiste: datos crudos, sin derivar
export interface StoredKid {
  id: string; // "local-mf3k2a1" — Date.now().toString(36)
  createdAt: string; // ISO "2026-09-24T10:00:00.000Z"
  name: string; // "Martina López"
  birthDate: string; // "2023-04-14" — value del input type="date"
  room: Room; // "Lunas"
  allergies?: string; // "Maní, Lactosa"
  notes?: string; // "Indicaciones, medicación…"
}

export function loadLocalKids(): Kid[]; // StoredKid[] → Kid[] derivado; [] en SSR o si falla
export function saveLocalKid(input: Omit<StoredKid, "id" | "createdAt">): Kid;
```

Derivación al leer (`toKid`), siempre sobre el dato crudo:

- `id`: el guardado; `initial`: primera letra del nombre en mayúscula.
- `ageYears`: calculada de `birthDate` contra la fecha actual.
- `birthDate` (display): `14 abr 2023` (mismo formato que los mock).
- `joinDate`: mes/año de `createdAt` → `sep 2026`.
- `allergies`: `{ badge: primera etiqueta.trim().toUpperCase(), text: string completo }`; sin etiquetas → `undefined`.
- `parents`: `[]`. Paleta de avatar rotativa por índice con los 5 combos ya usados en los mock (`#A9D9E8/#1F7A93`, `#F4B8CC/#C44A7A`, `#B9DEC4/#3E8B62`, `#C9B6E8/#7B5FC0`, `#F4DC8E/#9A7B1E`).

Convención de enrutamiento: el prefijo `local-` distingue los ids locales de los mock, para que `app/kids/[id]/page.tsx` pueda seguir usando `notFound()` en el servidor para el resto.

## Implementation plan

1. **Icono.** Agregar `ChevronDownIcon` (`path d="m6 9 6 6 6-6"`, el del template) a `components/shared/icons.tsx`. _Prueba: `npx tsc --noEmit` limpio._
2. **Salas.** Crear `app/_data/rooms.ts` con `ROOMS` y `Room`. _Prueba: `npx tsc --noEmit` limpio; la UI no cambia._
3. **Persistencia.** Crear `app/_data/localKids.ts` con `StoredKid`, `LOCAL_KIDS_KEY`, `loadLocalKids` (`typeof window === "undefined"` → `[]`, `JSON.parse` en `try/catch`, fallback a arreglo en memoria) y `saveLocalKid` con toda la derivación. _Prueba: desde la consola del navegador, `saveLocalKid(...)` escribe en `openDaycare:kids:v1` y `loadLocalKids()` lo devuelve derivado; bloqueando el storage no se lanza excepción._
4. **Modal.** Crear `components/kids/AddKidModal.tsx` (client) con el calco: cabecera de 3 zonas, los 5 campos, estado de formulario, validación inline y cierre por `Cancelar`/`Esc`/fondo. Crear `components/kids/KidsScreen.tsx` (client) que mantiene `isModalOpen` y `localKids`, y cambiar `KidsHeader` para recibir `onAdd` (el `Link` pasa a `<button>`). `app/kids/page.tsx` sigue siendo server y solo renderiza `<KidsScreen kids={KIDS} />`. _Prueba: abrir el modal, guardar vacío → errores y no cierra; completo → se cierra y el registro está en `localStorage`._
5. **Lista agrupada.** En `KidsScreen`, cargar los locales en `useEffect` y agrupar `[...kids, ...localKids]` por `ROOMS`; crear `components/kids/KidsRoomSection.tsx` y pasar `room`/`count` a `KidsRoomLabel` (ya sin import de `KIDS`). _Prueba: `/kids` muestra `SALA SOLES · 8 niños` con sus 8 tarjetas; crear un niño en `Lunas` muestra `SALA LUNAS · 1 niño`; `Estrellas` no aparece._
6. **Acordeón.** `KidsRoomSection` con `useState` (expandido por defecto), botón con `ChevronDownIcon` que rota y `aria-expanded`, grid condicional. _Prueba: contraer/expande sin navegar; recargar vuelve a expandidas._
7. **Perfil local.** Crear `components/kid-profile/LocalKidProfile.tsx` (client, reusa `ProfileHero`/`AllergyBanner`/`ProfileFacts`/`ProfileAside`/`ParentsCard`) y ramificar `app/kids/[id]/page.tsx`: id en `KIDS` → como hoy; id con prefijo `local-` → `LocalKidProfile`; cualquier otro → `notFound()`. _Prueba: el perfil del niño creado muestra sus datos; `/kids/99` sigue mostrando el 404 nativo._
8. **Responsive y cierre.** Modal con `max-h` y scroll interno; en `< md` ocupa casi todo el ancho. _Prueba: sin scroll horizontal a 375px; `npm run lint` y `npx tsc --noEmit` sin errores._

## Acceptance criteria

- [ ] Click en `Agregar niño` (`/kids`) abre el modal y no navega.
- [ ] El modal replica `agregar-nino.dc.html`: cabecera `Cancelar`/`Agregar niño`/`Guardar` y los 5 campos con sus placeholders.
- [ ] `SALA` ofrece `Soles`, `Lunas` y `Estrellas`, con `Soles` por defecto.
- [ ] Con cualquiera de los 3 obligatorios vacío, `Guardar` no cierra ni guarda y ese campo muestra borde rojo + `Este campo es obligatorio`.
- [ ] Alergias y notas se pueden dejar vacías sin bloquear el guardado.
- [ ] Tras guardar, el modal se cierra y el registro existe en `localStorage` bajo `openDaycare:kids:v1`.
- [ ] Reabrir el modal muestra los campos vacíos.
- [ ] `Cancelar`, `Esc` y el click en el fondo cierran descartando lo escrito.
- [ ] `app/_data/kids.ts` queda byte a byte igual (sus 8 niños siguen intactos).
- [ ] Recargar `/kids` mantiene el niño nuevo al final de su sala.
- [ ] El divisor de Soles al inicio sigue diciendo `SALA SOLES · 8 niños` con las 8 tarjetas (calco de SPEC 02).
- [ ] Un niño creado en `Lunas` crea el divisor `SALA LUNAS · 1 niño` con su tarjeta; `Estrellas` sin niños no muestra divisor.
- [ ] El contador usa `1 niño` en singular y `N niños` en plural.
- [ ] Click en el divisor contrae/expande solo esa sala; todas arrancan expandidas y al recargar vuelven a expandidas.
- [ ] El chevron rota al contraer y el botón expone `aria-expanded`.
- [ ] La tarjeta del niño nuevo navega a su `/kids/local-…` y muestra nombre, `N años · Sala`.
- [ ] Su perfil muestra la fecha de nacimiento convertida (`14 abr 2023`), la sala, `Ingreso` = mes de creación, `PADRES VINCULADOS` en estado vacío y `Vincular otro padre`.
- [ ] Sin alergias no se renderiza el banner; con alergias el banner muestra el texto completo y la tarjeta el badge con la primera etiqueta en mayúsculas (`MANÍ`).
- [ ] `/kids/99` sigue mostrando el 404 nativo de Next.js.
- [ ] `/kids/local-<id inexistente>` muestra un bloque "no encontrado" con `Volver a Niños`, sin romper la app.
- [ ] Con `localStorage` bloqueado, guardar un niño no lanza excepciones (queda en memoria hasta recargar).
- [ ] A 375px el modal no produce scroll horizontal y su contenido hace scroll interno.
- [ ] No hay avisos de hidratación ni errores de consola en `/kids` y en el perfil de un niño nuevo.
- [ ] `npm run lint` pasa sin errores.
- [ ] `npx tsc --noEmit` pasa sin errores.

## Decisions

- **Sí:** modal abierto desde `/kids`. **No:** ruta `/kids/new` como página (SPEC 02 la dejó fuera de alcance y el usuario pidió modal).
- **Sí:** `app/_data/kids.ts` intacto; los locales viven en `app/_data/localKids.ts`. **No:** mutar `KIDS` en runtime (rompería el pintado del servidor y el calco de SPEC 02).
- **Sí:** clave `openDaycare:kids:v1` con prefijo de app y versión. **No:** `kids` simple (colisiona con otras apps del mismo origen y no deja camino de migración).
- **Sí:** persistir `StoredKid` (crudo) y derivar `Kid` en cada lectura. **No:** guardar el `Kid` ya derivado (un cambio de derivación no aplicaría a registros viejos).
- **Sí:** `input type="date"`. **No:** texto con máscara `dd/mm/aaaa` (validación y conversión a mano).
- **Sí:** id `local-<Date.now().toString(36)>` y el prefijo `local-` como llave de enrutamiento del perfil. **No:** continuar la serie numérica `9`, `10`… (indistinguible de un id inexistente y se reinicia al limpiar el storage).
- **Sí:** mantener `app/kids/[id]/page.tsx` como server component y delegar los locales a `LocalKidProfile`. **No:** convertir la página entera a client (perdería el 404 nativo que exige SPEC 02).
- **Sí:** `KidsScreen.tsx` como componente client hijo de una página server. **No:** `"use client"` en `app/kids/page.tsx` (precedente de SPEC 03: las páginas no se hacen client).
- **Sí:** leer `localStorage` en `useEffect` tras el montaje. **No:** leerlo en el primer render (React avisaría de contenido distinto entre servidor y cliente).
- **Sí:** agrupar por `ROOMS` con acordeón expandido por defecto, sin persistir el estado. **No:** divisor único fijo (ignora la sala) ni guardar el colapso en `localStorage` (otra superficie de fallo por poco valor).
- **Sí:** ocultar las salas sin niños. **No:** mostrar `SALA LUNAS · 0 niños`.
- **Sí:** fallback en memoria si `localStorage` falla. **No:** lanzar el error ni ocultar el alta.
- **Sí:** validar solo que los 3 obligatorios no estén vacíos. **No:** fecha futura, duplicados ni longitud mínima (no pedidos).
- **Sí:** derivar `initial`, `ageYears`, `joinDate`, `parents: []` y paleta de avatar rotativa. **No:** agregar más inputs al modal (rompe el calco).
- **Sí:** badge = primera etiqueta en mayúsculas. **No:** todas las etiquetas en el badge (se desborda el ancho de la tarjeta) ni tarjeta sin badge (pierde la señal visual del template).
- **Sí:** cierre silencioso tras guardar. **No:** construir toasts en esta spec (no existe sistema de notificaciones en el repo).
- **Sí:** `ChevronDownIcon` agregado a `components/shared/icons.tsx`. **No:** SVG inline en el componente (convención de SPEC 01/03).
- **Nota:** esta spec modifica dos criterios ya marcados de SPEC 02: `Agregar niño` deja de ser inerte y el divisor `SALA SOLES · 8 niños` pasa a ser dinámico y agrupado.

## Risks

| Riesgo                                                                            | Mitigación                                                                                                    |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| El servidor pinta 8 niños y el cliente pinta 8 + locales → aviso de hidratación   | Los locales se cargan en `useEffect`, así el primer render del cliente coincide con el del servidor.          |
| `local-*` no se puede resolver en el servidor → primer pintado vacío en el perfil | `LocalKidProfile` renderiza un estado de carga y un bloque "no encontrado" con `Volver a Niños`; nunca lanza. |
| `localStorage` bloqueado o corrupto                                               | `loadLocalKids` con `try/catch` + fallback en memoria; la UI sigue funcionando, solo no persiste.             |
| Cambios sobre criterios ya aprobados de SPEC 02                                   | Registrados en Decisions; el calco visible de `/kids` no cambia hasta que se crea un niño.                    |
| La edad derivada cambia sola al cumplir años                                      | Efecto deseable de derivar `ageYears` en cada lectura; documentado para que no se lea como bug.               |

## What is **not** in this spec

- Backend, API o base de datos.
- Editar o eliminar niños.
- Vincular padres desde el modal.
- Buscador funcional.
- Niños nuevos visibles en el feed/home (SPEC 01).
- Toasts o notificaciones.
- Subida de fotos.

Cada uno de esos, si llega, va en su propia spec.
