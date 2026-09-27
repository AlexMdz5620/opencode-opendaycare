# SPEC 06 — Modal de nueva publicación en el sidebar (calco de crear-publicacion.dc.html)

> **Estado:** Implemented
> **Depende de:** SPEC 01, SPEC 02, SPEC 04
> **Fecha:** 2026-09-26
> **Objetivo:** Abrir un modal calco de `crear-publicacion.dc.html` desde `Nueva publicación` y el composer, con audiencia multi-niño, 7 tipos y fotos manuales, publicando posts en un feed en memoria sin backend.

## Scope

**In:**

- Modal `CreatePostModal` en `components/home/CreatePostModal.tsx` (client), calco de `references/pantallas/crear-publicacion.dc.html` como overlay `bg-black/50` con tarjeta `max-w-[580px]`, fondo `#FBF4EC`, borde `#ECE0D0`, radio `24px`, `role="dialog"` y `aria-modal` (patrón `AddKidModal`).
- Cabecera de 3 zonas: `Cancelar` · `Nueva publicación` · `Publicar` (`#D9583C`); `Cancelar` cierra descartando.
- Sección `PARA`: pills con avatar/inicial del niño (colores del `Kid`) y nombre propio + pill `Toda la sala` sin avatar; selección múltiple con toggle estilo pill (sin checkbox cuadrado).
- Reglas de exclusividad de `PARA`: marcar `Toda la sala` limpia todos los niños seleccionados; con `Toda la sala` marcado, clickear un niño lo desmarca a él solo y desmarca `Toda la sala`. Arranca con nada seleccionado.
- Lista `PARA` = los 8 mock de `KIDS` (SPEC 02) + los locales de `loadLocalKids()` (SPEC 04), por nombre propio, en ese orden.
- Sección `TIPO`: los 7 pills del template (`Comida`, `Siesta`, `Actividad`, `Logro`, `Ánimo`, `Foto`, `Anuncio`) con sus colores exactos, seleccionable uno.
- Sección `DESCRIPCIÓN`: textarea placeholder `Contá cómo le fue hoy…`, arranca vacío.
- Sección `FOTOS`: botón dashed `Agregar` (96px, `+` rojo) que abre `input type="file" accept="image/*" multiple`; previews de 96px con `CloseIcon` para quitar; sin límite de cantidad; **sin** Drag&Drop.
- Validación al pulsar `Publicar`: audiencia vacía, tipo vacío o descripción vacía → `Este campo es obligatorio` en rojo `#D9583C` bajo la sección (borde rojo en el textarea); con errores no cierra.
- `Publicar` válido construye el post (autor Caro Giménez, hora actual `HH:MM`, `publishedByMe`, `hearts: 0`, `comments: 0`), lo agrega **arriba** del feed y cierra el modal.
- Contexto `FeedContext` en `components/home/FeedContext.tsx`, provider montado en `app/layout.tsx`: `posts` (inicia con `POSTS`), `addPost`, `isCreateOpen`, `openCreate`, `closeCreate`. El modal vive dentro del provider, así abre desde cualquier página.
- Apertura desde el botón `Nueva publicación` del sidebar (deja de ser `Link href="#"` y pasa a `<button>`, funciona en desktop y en el drawer mobile) y desde el composer `Compartí un momento…` (deja de ser `<a href="#">`).
- `app/page.tsx` delega el feed en `components/home/FeedScreen.tsx` (client) que compone `FeedHeader`, `Composer`, `FeedDivider` y la lista de `PostCard` desde el contexto.
- `PostType` ampliado a 7 valores (`meal`, `nap`, `activity`, `achievement`, `mood`, `photo`, `announcement`) con sus labels `COMIDA`/`SIESTA`/… y estilos de badge en `PostCard` (mismo patrón pill suave + label coloreado + dot).
- `FeedPost` con campo nuevo `photos?: string[]` (object URLs); `PostCard` renderiza las fotos reales en una fila de thumbnails 96px `object-cover rounded-[14px]`; los mocks con `photoPlaceholder` siguen igual.
- Cierre con `Cancelar`, `Esc` y click en el fondo, descartando todo (incluidas las fotos); el modal se desmonta al cerrar (estado y previews se reinician).
- Responsive: a 375px sin scroll horizontal; la tarjeta tiene `max-h` con scroll interno.

**Out of scope (for future specs):**

- Backend, API, base de datos o persistencia: los posts nuevos se pierden al recargar.
- Drag&Drop de fotos (decidido: manual).
- Editar o eliminar posts publicados (`Editar` sigue siendo visual).
- Comentarios o reacciones funcionales.
- Feed de familias, detalle de publicación y las demás pantallas del catálogo.
- Compartir la publicación con salas distintas de Soles o con usuarios externos.
- Subida real de archivos a un servidor (solo object URLs en memoria).
- Cambiar `app/_data/kids.ts`, `localKids.ts` o los mocks de `POSTS`.

## Data model

Ampliación en `app/_data/mock.ts`:

```ts
export type PostType =
  | "meal"
  | "nap"
  | "activity"
  | "achievement"
  | "mood"
  | "photo"
  | "announcement";

export const POST_TYPE_LABEL: Record<PostType, string> = {
  meal: "COMIDA",
  nap: "SIESTA",
  activity: "ACTIVIDAD",
  achievement: "LOGRO",
  mood: "ÁNIMO",
  photo: "FOTO",
  announcement: "ANUNCIO",
};

export const POST_TYPE_ORDER: PostType[] = [
  "meal",
  "nap",
  "activity",
  "achievement",
  "mood",
  "photo",
  "announcement",
];

export interface FeedPost {
  // …campos existentes sin cambios…
  photos?: string[]; // object URLs en memoria — solo posts nuevos
}
```

Contexto nuevo `components/home/FeedContext.tsx`:

```ts
interface FeedContextValue {
  posts: FeedPost[]; // arranca con POSTS
  addPost: (post: FeedPost) => void; // prepend
  isCreateOpen: boolean;
  openCreate: () => void;
  closeCreate: () => void;
}
```

Estado local del modal (se pierde al cerrar):

```ts
const [selectedKidIds, setSelectedKidIds] = useState<string[]>([]);
const [allRoom, setAllRoom] = useState(false); // "Toda la sala"
const [type, setType] = useState<PostType | null>(null);
const [description, setDescription] = useState("");
const [photos, setPhotos] = useState<string[]>([]); // object URLs
const [errors, setErrors] = useState<{
  audience?: boolean;
  type?: boolean;
  description?: boolean;
}>({});
```

Audiencia derivada al publicar:

```ts
// allRoom → "toda la sala"
// caso contrario → `familia de ${nombresPropios.join(", ")}`
// "familia de Mateo" | "familia de Mateo, Sofía"
```

`Toda la sala` = los `Kid` con `room === "Soles"` (mock + locales de Soles).

Post nuevo:

```ts
{
  id: `p-${Date.now().toString(36)}`,
  authorName: "Caro Giménez",
  avatarBg: "#F2937A", avatarColor: "#FFFFFF",
  time: "HH:MM" actual,
  publishedByMe: true,
  type, audience, text: description,
  photos: photos.length ? photos : undefined,
  hearts: 0, comments: 0,
}
```

## Implementation plan

1. **Tipos.** Ampliar `PostType`, `POST_TYPE_LABEL` y agregar `POST_TYPE_ORDER` en `app/_data/mock.ts`; agregar `photos?: string[]` a `FeedPost`. _Prueba: `npx tsc --noEmit` limpio; la UI no cambia._
2. **Contexto.** Crear `components/home/FeedContext.tsx` con el provider (posts = `POSTS`, modal cerrado) y envolver `app/layout.tsx`. _Prueba: app renderiza igual, consola limpia._
3. **FeedScreen.** Crear `components/home/FeedScreen.tsx` (client) con el markup actual de `app/page.tsx`; la página queda como server que solo renderiza `<FeedScreen />`. _Prueba: `/` idéntico al de SPEC 01._
4. **PostCard.** Extender `BADGE_STYLES` a los 7 tipos y renderizar `post.photos` como fila de thumbnails (los mocks sin `photos` no cambian). _Prueba: los 3 posts mock se ven idénticos._
5. **Apertura.** Crear `CreatePostModal` con overlay, cabecera y cierre (`Cancelar`/`Esc`/fondo); `Sidebar` y `Composer` pasan a `<button>` que llaman `openCreate`. _Prueba: abre desde `/` y desde `/kids`, en desktop y en el drawer mobile; las 3 vías de cierre funcionan._
6. **PARA.** Pills de kids (mock + locales cargados con `loadLocalKids()` al montar) con las reglas de exclusividad. _Prueba: marcar `Toda la sala` limpia los niños; clickear un niño con `Toda la sala` activo lo desmarca a él y desmarca `Toda la sala`._
7. **TIPO + DESCRIPCIÓN.** Los 7 pills con colores del template y el textarea vacío. _Prueba: cambiar de tipo actualiza el pill activo; escribir en el textarea._
8. **Validación.** `handlePublish` con los 3 errores (`Este campo es obligatorio`, borde rojo en el textarea) y no cierra si hay errores. _Prueba: vacío marca las 3 secciones y no cierra._
9. **Fotos.** `input file` + previews con X y revocación de object URLs al quitar o cancelar. _Prueba: agregar 2 fotos, quitar 1, cancelar y reabrir sin previews._
10. **Publicar.** Construir el post, `addPost` (prepend), cerrar; verificar hora, audiencia derivada y `photos` en el feed. _Prueba: publicar con `Toda la sala` dice `Para: toda la sala`; con 2 niños dice `Para: familia de Mateo, Sofía`._
11. **Responsive y cierre.** `max-h` + scroll interno; a 375px sin scroll horizontal. _Prueba: `npm run lint` y `npx tsc --noEmit` sin errores; consola limpia en `/` y `/kids`._

## Acceptance criteria

- [x] Click en `Nueva publicación` (sidebar desktop o drawer mobile, en `/` o `/kids`) abre el modal y no navega.
- [x] Click en el composer `Compartí un momento…` abre el mismo modal.
- [x] El modal replica `crear-publicacion.dc.html`: cabecera `Cancelar`/`Nueva publicación`/`Publicar`, secciones `PARA`, `TIPO`, `DESCRIPCIÓN`, `FOTOS` con botón `Agregar`.
- [x] `PARA` lista los 8 niños mock por nombre propio con sus avatares, más los locales creados en localStorage.
- [x] `PARA` permite seleccionar varios niños (estilo pill con toggle, sin checkbox cuadrado) y arranca con nada seleccionado.
- [x] Marcar `Toda la sala` elimina la selección de todos los niños y solo queda `Toda la sala`.
- [x] Con `Toda la sala` marcado, clickear un niño lo selecciona a él y desmarca `Toda la sala`.
- [x] `TIPO` muestra los 7 pills del template con sus colores y solo uno queda activo.
- [x] `Publicar` con audiencia, tipo o descripción vacíos no cierra y la sección faltante muestra `Este campo es obligatorio` en rojo `#D9583C`.
- [x] Con los 3 campos completos, `Publicar` cierra el modal y el post nuevo aparece arriba del feed.
- [x] El post nuevo muestra autor `Caro Giménez` con avatar `C`, la hora actual y `publicado por vos`.
- [x] Con `Toda la sala`, el feed muestra `Para: toda la sala`; con 2 niños, `Para: familia de Mateo, Sofía`.
- [x] El badge del post nuevo corresponde al tipo elegido (`COMIDA`, `SIESTA`, `ÁNIMO`, `FOTO`, etc.).
- [x] El botón `Agregar` abre el selector de archivos y las fotos elegidas aparecen como previews con X para quitarlas.
- [x] Las fotos elegidas se ven como thumbnails reales en el post publicado.
- [x] No hay Drag&Drop (arrastrar un archivo al modal no lo adjunta).
- [x] `Cancelar`, `Esc` y el click en el fondo cierran descartando todo; al reabrir arranca vacío.
- [x] El post nuevo se ve en el feed aunque antes hayas visitado `/kids` (estado en el provider del layout).
- [x] Recargar la página borra los posts nuevos (los 3 mock vuelven intactos).
- [x] Los 3 posts mock se ven byte a byte iguales a SPEC 01 (badges, placeholders, contadores).
- [x] A 375px no hay scroll horizontal y la tarjeta hace scroll interno.
- [x] No hay errores de consola ni avisos de hidratación en `/` y `/kids`.
- [x] `npm run lint` pasa sin errores.
- [x] `npx tsc --noEmit` pasa sin errores.

## Decisions

- **Sí:** overlay oscuro con tarjeta de 580px, patrón de SPEC 04/05. **No:** ruta `/new` como página (el usuario pidió "modal" y el sidebar vive en todas las páginas).
- **Sí:** posts nuevos en un contexto global montado en `app/layout.tsx`. **No:** estado local de la página del feed (publicar desde `/kids` no se vería) ni `localStorage` (decisión explícita: "almacenado en memoria… después conectamos la db").
- **Sí:** el modal vive dentro del provider y abre desde cualquier página. **No:** renderizar un modal por página (duplicaría estado).
- **Sí:** `PostType` ampliado a los 7 del template, con datos en inglés y labels en español (convención de SPEC 01). **No:** mapear a los 3 existentes (perdería Comida/Siesta/Ánimo/Foto) ni renombrar los 3 actuales (rompería los mocks).
- **Sí:** badges nuevos siguiendo el patrón pill suave del feed con los colores del template (`#E7DCF6`/`#7B5FC0`, `#F9D2DE`/`#C56486`, `#FBD8CC`/`#D9684A`; comida deriva `#9A7B1E` sobre pill `#F3E9CF`). **No:** pills sólidos como en el template (romperían la fila de badges existente).
- **Sí:** solo fotos manuales. **No:** Drag&Drop (el usuario lo dejó opcional y pidió no complejizar).
- **Sí:** previews y post con object URLs en memoria. **No:** convertir a base64 (peso innecesario sin persistencia).
- **Sí:** revocar los object URLs al quitar una foto o cancelar. **No:** revocar al publicar (las fotos deben verse en el feed).
- **Sí:** los 3 campos obligatorios con el patrón de error de SPEC 04/05. **No:** tipo preseleccionado (el usuario eligió validar los 3).
- **Sí:** `PARA` lista todos los niños (mock + locales); `Toda la sala` = solo `room === "Soles"`. **No:** filtrar `PARA` a Soles (los locales de otras salas seguirían siendo direccionables por nombre).
- **Sí:** autor = Caro Giménez (`#F2937A`/blanco, los colores de su avatar en el sidebar). **No:** derivar el autor de la audiencia (no corresponde: publica la maestra).
- **Sí:** post nuevo arriba del todo bajo `PUBLICADO HOY`. **No:** al final (lo nuevo debe verse primero).
- **Sí:** `FeedScreen` client hijo de `app/page.tsx` server (precedente `KidsScreen`). **No:** `"use client"` en la página.
- **Sí:** textarea arranca vacío. **No:** prellenar con el texto de ejemplo del template (es contenido de muestra).
- **Sí:** sin límite de fotos y sin validación de tamaño/tipo más allá de `accept="image/*"`. **No:** límite de 4 ni compresión (nada se sube).
- **Sin iconos nuevos:** `CloseIcon` (SPEC 05), `PlusIcon` y `CameraIcon` (SPEC 01) cubren el modal.
- **Nota:** este spec modifica dos criterios de SPEC 01: `Nueva publicación` y el composer dejan de ser placeholders inertes (mismo precedente que `Agregar niño` en SPEC 04).

## Risks

| Riesgo                                                                       | Mitigación                                                                                                                        |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Object URLs sin revocar acumulan memoria                                     | Revocar al quitar preview y al cancelar; al publicar se mantienen a propósito para verlas en el feed.                             |
| Provider en `layout.tsx` envuelve todas las rutas                            | Los children siguen pudiendo ser server components; las páginas no ganan `"use client"` (solo el provider y el modal).            |
| Posts nuevos visibles solo en cliente → posible desalineación de hidratación | El estado inicial del contexto es `POSTS` (igual que el pintado del servidor); los posts se agregan tras interacción del usuario. |
| `loadLocalKids()` lee localStorage                                           | El modal solo monta tras un click (nunca en el SSR), sin riesgo de hidratación; fallback en memoria ya probado en SPEC 04.        |
| Criterios ya aprobados de SPEC 01 quedan modificados                         | Registrados en Decisions con el precedente de SPEC 04.                                                                            |

## What is **not** in this spec

- Backend, base de datos o persistencia de posts.
- Drag&Drop de fotos.
- Editar, eliminar o reaccionar a posts.
- Comentarios funcionales.
- Salas distintas de Soles en `Toda la sala`.

Cada uno de esos, si llega, va en su propia spec.
