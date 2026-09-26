# SPEC 05 — Modal "Vincular padre" en el perfil del niño (calco de vincular-padre.dc.html)

> **Estado:** Approved
> **Depende de:** SPEC 02
> **Fecha:** 2026-09-25
> **Objetivo:** Abrir un modal calco de `vincular-padre.dc.html` desde el botón `Vincular otro padre` de `ParentsCard`, puramente estético: valida nombre y email, muestra un código de invitación aleatorio y cierra sin enviar nada ni persistir datos.

## Scope

**In:**

- Modal `LinkParentModal` en `components/kid-profile/LinkParentModal.tsx` (client), calco de `references/pantallas/vincular-padre.dc.html` como overlay: fondo `bg-black/50` (patrón de `AddKidModal`) y tarjeta centrada `max-w-[480px]`, fondo `#FBF4EC`, borde `#ECE0D0`, radio `24px`, `role="dialog"` y `aria-modal`.
- Cabecera: `Vincular padre` + subtítulo `a {kidName}` + botón X (`CloseIcon`).
- Banner azul `#E3ECFB` con `InfoIcon` y texto calco: `Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de {primer nombre}`.
- Campos `NOMBRE DEL PADRE/MADRE` (placeholder `Ej. Diego Fernández`) y `EMAIL` (type `email`, placeholder `correo@ejemplo.com`).
- Selector `PARENTESCO` con 3 pills: `Mamá` (activo por defecto), `Papá`, `Tutor/a`; el activo usa `border-[#9FB8EC] bg-[#CCD8F4] text-[#4E72C8]`.
- Bloque `CÓDIGO DE INVITACIÓN` (amarillo dashed `#FBF1D6`/`#E6D08A`): código de 5 caracteres aleatorios nuevo en cada apertura + `Vence en 7 días`.
- Botón `Enviar invitación` (`SendIcon`, gradiente `#F4977E→#EE8164`): valida y, si es válido, solo cierra el modal.
- Validación al enviar: nombre vacío → borde `#D9583C` + `Este campo es obligatorio`; email vacío → idem; email con formato inválido → `Ingresá un email válido`. Si hay errores, no cierra.
- Cierre con X, `Esc` y click en el fondo, descartando lo escrito (calco del comportamiento de `AddKidModal`).
- Apertura desde `Vincular otro padre` en los dos estados de `ParentsCard` (vacío y con lista); el `Link href="#"` pasa a `<button type="button">`.
- Al reabrir: campos vacíos, sin errores, `Mamá` activo y código nuevo (el modal se desmonta al cerrar).
- `ParentsCard` recibe la nueva prop `kidName: string` y pasa a `"use client"`; `ProfileAside` pasa `kidName={kid.name}`, así el modal funciona igual en `/kids/[id]` y en `LocalKidProfile`.
- Iconos nuevos en `components/shared/icons.tsx`: `CloseIcon`, `InfoIcon`, `SendIcon`.
- Responsive: a 375px sin scroll horizontal; la tarjeta tiene `max-h` con scroll interno.

**Out of scope (for future specs):**

- Envío real de correos o códigos de invitación (el banner es calco, no implementa nada).
- Persistencia en `localStorage` o en servidor: nada se guarda.
- Agregar, editar o eliminar padres de la lista (sigue siendo la de props).
- Ampliar `KidParent.relation` con `Tutor/a`.
- Backend, API, cuentas de familia o la activación real de `/activate-account`.
- Validación de duplicados (mismo email ya vinculado).
- Habilitar los demás botones visuales del perfil (`Editar`, `Resumen del día`).
- Modificar `app/_data/kids.ts`.

## Data model

Esta feature no introduce estructuras de datos nuevas ni persiste nada. Solo estado local del modal (se pierde al cerrar):

```ts
// Estado local de LinkParentModal — no se persiste
const [name, setName] = useState(""); // "Ej. Diego Fernández"
const [email, setEmail] = useState(""); // "correo@ejemplo.com"
const [relation, setRelation] = useState<"Mamá" | "Papá" | "Tutor/a">("Mamá");
const [code, setCode] = useState(() => generateInviteCode()); // "7K4P9"-style
const [errors, setErrors] = useState<{
  name?: boolean;
  email?: "empty" | "format";
}>({});

// 5 caracteres del alfabeto sin confundibles (sin I, O, 0, 1)
function generateInviteCode(): string;

// Formato de email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

Cambio de firmas:

```ts
// components/kid-profile/ParentsCard.tsx
export function ParentsCard({ parents, kidName }: { parents: KidParent[]; kidName: string });

// components/kid-profile/ProfileAside.tsx — única línea cambiada
<ParentsCard parents={kid.parents} kidName={kid.name} />;
```

`KidParent.relation` **no** se modifica (`"Mamá" | "Papá"`).

## Implementation plan

1. **Iconos.** Agregar `CloseIcon` (`M18 6 6 18M6 6l12 12`), `InfoIcon` (circle `r=10` + `M12 16v-4M12 8h.01`) y `SendIcon` (`m22 2-7 20-4-9-9-4z` + `M22 2 11 13`) a `components/shared/icons.tsx`. _Prueba: `npx tsc --noEmit` limpio._
2. **Esqueleto + apertura.** Crear `components/kid-profile/LinkParentModal.tsx` (client) con props `{ kidName, onClose }`: overlay oscuro, tarjeta, cabecera con `Vincular padre`, `a {kidName}` y X; cierre por X/`Esc`/fondo. `ParentsCard` pasa a `"use client"`, recibe `kidName`, `LinkParentButton` deja de ser `Link` y abre el modal; `ProfileAside` pasa `kidName={kid.name}`. _Prueba: en `/kids/1` y `/kids/4`, `Vincular otro padre` abre la tarjeta con el nombre real y las tres vías de cierre funcionan._
3. **Campos y parentesco.** Agregar el banner azul, `NOMBRE DEL PADRE/MADRE`, `EMAIL` y el selector `PARENTESCO` con `useState` (`Mamá` por defecto). _Prueba: escribir en los campos y cambiar de pill actualiza el estilo; nada se guarda._
4. **Código de invitación.** `generateInviteCode()` + bloque amarillo con `CÓDIGO DE INVITACIÓN`, el código y `Vence en 7 días`. _Prueba: abrir, cerrar y reabrir muestra un código distinto de 5 caracteres._
5. **Validación y envío.** `handleSubmit`: nombre vacío y email vacío → `Este campo es obligatorio`; formato inválido → `Ingresá un email válido`; borde rojo `#D9583C`; con errores no cierra; válido → solo cierra. _Prueba: vacío marca ambos y no cierra; `hola@` muestra el mensaje de formato; `diego@ejemplo.com` cierra sin tocar la lista._
6. **Responsive y cierre.** `max-h` + scroll interno en la tarjeta; a 375px la tarjeta ocupa casi todo el ancho sin scroll horizontal. _Prueba: sin scroll horizontal a 375px; `npm run lint` y `npx tsc --noEmit` sin errores; consola limpia en `/kids/1`, `/kids/4` y un perfil `local-`._

## Acceptance criteria

- [x] Click en `Vincular otro padre` en estado vacío (`/kids/4`) abre el modal y no navega.
- [x] Click en `Vincular otro padre` con padres (`/kids/1`) abre el mismo modal.
- [x] La tarjeta replica `vincular-padre.dc.html`: cabecera `Vincular padre` + `a Mateo Fernández` + X, banner azul, `NOMBRE DEL PADRE/MADRE`, `EMAIL`, `PARENTESCO` con `Mamá`/`Papá`/`Tutor/a`, bloque `CÓDIGO DE INVITACIÓN` con `Vence en 7 días` y botón `Enviar invitación`.
- [x] El subtítulo y el banner usan el niño real: en `/kids/4` dicen `a Valentina Soto` y `el feed de Valentina`.
- [x] El overlay es oscuro (`bg-black/50`) y la tarjeta mide `max-w-[480px]` centrada.
- [x] `Mamá` arranca activo; al clickear `Papá` o `Tutor/a` el pill activo cambia al seleccionado.
- [x] El código tiene 5 caracteres y es distinto en cada apertura del modal.
- [x] `Enviar invitación` con nombre y email vacíos no cierra y ambos campos muestran borde rojo `#D9583C` + `Este campo es obligatorio`.
- [x] Un email con formato inválido (`hola@`) no cierra y muestra `Ingresá un email válido`.
- [x] Con nombre y email válidos el modal se cierra sin enviar nada y la lista de padres queda intacta.
- [x] `X`, `Esc` y el click en el fondo cierran descartando lo escrito.
- [x] Al reabrir el modal: campos vacíos, sin errores, `Mamá` activo y código nuevo.
- [x] El modal abre igual en el perfil local (`/kids/local-…`), sin cambios en `app/_data/kids.ts`.
- [x] `Vincular otro padre` es un `<button>` que no navega (dejó de ser `Link href="#"`).
- [x] A 375px no hay scroll horizontal y la tarjeta hace scroll interno si el contenido desborda.
- [x] No hay errores de consola ni avisos de hidratación en `/kids/1`, `/kids/4` y un perfil local.
- [x] `npm run lint` pasa sin errores.
- [x] `npx tsc --noEmit` pasa sin errores.

## Decisions

- **Sí:** overlay con fondo oscuro, calco de `AddKidModal`. **No:** ruta nueva `/kids/[id]/link-parent` (el pedido fue modal en `ParentsCard`) ni fondo claro `#F6ECDF` del template (el template es una página, no un overlay).
- **Sí:** `Enviar invitación` solo cierra el modal. **No:** agregar el padre con badge `PENDIENTE` (decisión explícita: "solo será estético") ni enviar correo.
- **Sí:** `kidName` real por prop, en línea con la decisión del usuario. **No:** texto fijo `Mateo Fernández` (diría "Mateo" en el perfil de Valentina).
- **Sí:** el banner deriva el primer nombre con `kidName.split(" ")[0]`. **No:** dejar el literal `Mateo` del template.
- **Sí:** código aleatorio de 5 caracteres sobre `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (sin `I`, `O`, `0`, `1`), regenerado en cada apertura. **No:** `7K4P9` fijo ni código persistido.
- **Sí:** validar no vacío en nombre y email + regex simple `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. **No:** validación en `onChange` (los errores aparecen al enviar, como en SPEC 04) ni validación RFC completa.
- **Sí:** los 3 parentescos en el selector, calco literal. **No:** ampliar `KidParent.relation` (no se agrega nada a la lista; el estado es local).
- **Sí:** `ParentsCard` pasa a `"use client"` con `isModalOpen`. **No:** `"use client"` en `ProfileAside`, `LocalKidProfile` ni las páginas.
- **Sí:** desmontar el modal al cerrar (estado y código se reinician gratis). **No:** mantenerlo montado con `hidden` (hay que resetear cada campo a mano).
- **Sí:** `Link href="#"` → `<button type="button">`. **No:** conservar el Link (navegaría a `#`).
- **Sí:** `CloseIcon`/`InfoIcon`/`SendIcon` en `components/shared/icons.tsx`. **No:** SVG inline en el componente (convención de SPEC 01/03/04).
- **Sí:** `max-w-[480px]` del template. **No:** los `520px` de `AddKidModal` (en un calco gana el template).
- **Nota:** este spec modifica el criterio de SPEC 02 "`Vincular otro padre` … no navegan ni ejecutan acciones": el botón ahora abre el modal (mismo precedente que `Agregar niño` en SPEC 04).

## Risks

| Riesgo                                                             | Mitigación                                                                                                  |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `ParentsCard` pasa a client y se importa desde un server component | Next lo permite; `ProfileAside` y las páginas siguen sin `"use client"` (precedente `KidsScreen`, SPEC 04). |
| El banner promete un correo que nunca se envía                     | Registrado en Out of scope y Decisions: es calco del template; el envío real va en otra spec.               |
| `Tutor/a` es seleccionable pero `KidParent.relation` no lo admite  | El estado es local y nada se persiste; si algún día se agrega a la lista, esa spec amplía el tipo.          |
| Criterio ya aprobado de SPEC 02 queda modificado                   | Registrado en Decisions con el precedente de SPEC 04.                                                       |

## What is **not** in this spec

- Envío real de correos o códigos de invitación.
- Persistencia (`localStorage`, servidor) o cambios en la lista de padres.
- Backend, autenticación o activación de cuenta real.
- Ampliar `KidParent.relation` con `Tutor/a`.
- Editar o eliminar padres ya vinculados.
- Habilitar `Editar` o `Resumen del día`.

Cada uno de esos, si llega, va en su propia spec.
