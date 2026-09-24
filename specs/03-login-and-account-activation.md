# SPEC 03 — Login y activación de cuenta (calco de login.dc.html y activar-cuenta.dc.html)

> **Estado:** Approved
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-09-24
> **Objetivo:** Implementar las pantallas `/login` y `/activate-account` como calcos de `login.dc.html` y `activar-cuenta.dc.html`, sin selector de rol ni navbar, con URLs en inglés y navegación solo entre las dos pantallas.

## Scope

**In:**

- Página `/login` en `app/login/page.tsx`, calco de `references/pantallas/login.dc.html` **sin el bloque `INGRESO COMO`** (se eliminan los botones `Personal` y `Familia` y todo su estado): panel de marca izquierdo (gradiente `#F6A98E→#EC7E62`, círculos decorativos, logo `OpenDayCare`, h1 `El día de cada niño, compartido con su familia.`, párrafo y pie `🌿 Guardería Sala Soles`) + formulario derecho (`Iniciar sesión`, `Ingresá para ver el día de hoy.`, campos `EMAIL` con `caro@opendaycare.com` y `CONTRASEÑA`, `¿Olvidaste tu contraseña?`, botón `Iniciar sesión`, link `Activá tu cuenta`).
- Página `/activate-account` en `app/activate-account/page.tsx`, calco de `references/pantallas/activar-cuenta.dc.html`: bloque logo, h1 `Bienvenida a OpenDayCare`, párrafo de invitación, tarjeta `Te invitaron a seguir a · Mateo · Sala Soles`, `CÓDIGO DE INVITACIÓN` (`7K4P9`), `EMAIL`, `CREAR CONTRASEÑA`, checkbox de autorización de fotos, botón `Activar mi cuenta` y link `Iniciar sesión`.
- Componentes nuevos: `components/login/BrandPanel.tsx`, `components/login/LoginForm.tsx`, `components/activate-account/ActivateHeader.tsx`, `components/activate-account/InviteCard.tsx`, `components/activate-account/ActivateForm.tsx`, `components/activate-account/PhotoConsent.tsx`.
- `CheckIcon` nuevo en `components/shared/icons.tsx` (mismo `polyline` 20 6 9 17 4 12 del template).
- Datos de la tarjeta de invitación reusados de `app/_data/kids.ts` (kid id `"1"`, Mateo), sin duplicar texto.
- Campos editables (`defaultValue` del template) y checkbox con estado (`useState`, arranca marcado).
- Navegación real solo entre las dos pantallas con `next/link`: `Activá tu cuenta` → `/activate-account`, `Iniciar sesión` → `/login`.
- Pantalla completa sin `Sidebar`, sin `MobileNav` ni hamburguesa en ambas rutas.
- Responsive: en `< md` el split del login se apila (panel de marca arriba, formulario debajo).
- `metadata` por página (título `Iniciar sesión · OpenDayCare` / `Activar cuenta · OpenDayCare`).
- Fondo propio de estas pantallas `#FBF4EC` (el global `#F6ECDF` de SPEC 01 no cambia).

**Out of scope (for future specs):**

- Autenticación, sesiones, validación de credenciales, persistencia y redirección post-login (`/` o `familia-feed`): los botones `Iniciar sesión` y `Activar mi cuenta` quedan visuales, dejando la redirección para una spec futura.
- Flujo de `¿Olvidaste tu contraseña?` (link visual sin destino).
- Conectar el resto de la app con `/login` (el logout del sidebar sigue apuntando a `#`).
- Selector de rol `Personal` / `Familia` (decidido: fuera).
- Textos de UI en inglés (solo las URLs van en inglés).
- Pantalla `familia-feed` y el resto del catálogo pendiente.
- Conexión del formulario con el kid real por código de invitación (el código es mock).

## Data model

Esta feature no introduce estructuras de datos nuevas. Reutiliza `KIDS` / `getKidById` de `app/_data/kids.ts` (SPEC 02) para la tarjeta de invitación, y los valores de formulario (`7K4P9`, `lucia.fernandez@gmail.com`, `caro@opendaycare.com`) viven como `defaultValue` en los componentes.

## Implementation plan

1. **Icono.** Agregar `CheckIcon` a `components/shared/icons.tsx`. _Prueba: `npx tsc --noEmit` limpio._
2. **Login: panel de marca.** Crear `components/login/BrandPanel.tsx` y `app/login/page.tsx` (server component + `metadata`) con el contenedor `min-h-screen` fondo `#FBF4EC` y el split `1.05fr / 1fr` sin `Sidebar`/`MobileNav`. _Prueba: `/login` muestra el panel naranja y el hueco del formulario._
3. **Login: formulario.** Crear `components/login/LoginForm.tsx` con h2, párrafo, `EMAIL`, `CONTRASEÑA`, `¿Olvidaste tu contraseña?`, botón primario (sin navegación) y el link inferior. Sin rastro de `INGRESO COMO`/`Personal`/`Familia`. _Prueba: comparar contra `references/pantallas/login.dc.html`._
4. **Activación.** Crear `components/activate-account/` (`ActivateHeader`, `InviteCard` desde `KIDS` id `"1"`, `ActivateForm`, `PhotoConsent` client con `useState`) y `app/activate-account/page.tsx`. _Prueba: `/activate-account` calco completo; el checkbox se marca y desmarca._
5. **Links entre pantallas.** `LoginForm` → `Activá tu cuenta` con `next/link` a `/activate-account`; `ActivateForm` → `Iniciar sesión` con `next/link` a `/login`. _Prueba: la navegación funciona en ambos sentidos; los dos botones principales no navegan._
6. **Responsive y cierre.** Apilar el split del login en `< md` y verificar el centrado de `/activate-account` en 375px. _Prueba: sin scroll horizontal en 375px; `npm run lint` y `npx tsc --noEmit` sin errores._

## Acceptance criteria

- [x] `http://localhost:3000/login` renderiza el calco de `login.dc.html` (panel de marca, logo, h1, pie, formulario con sus textos).
- [x] En `/login` no existe el bloque `INGRESO COMO` ni los botones `Personal`/`Familia`.
- [x] `http://localhost:3000/activate-account` renderiza el calco de `activar-cuenta.dc.html` (logo, h1, párrafo, tarjeta de invitación, campos, checkbox, botón, link).
- [x] Ninguna de las dos pantallas renderiza `Sidebar`, `MobileNav` ni botón hamburguesa; ambas ocupan todo el viewport.
- [x] La tarjeta de invitación muestra `Mateo · Sala Soles` con avatar `M` usando el dato de `app/_data/kids.ts`.
- [x] Los campos de ambas pantallas son editables con los `defaultValue` del template.
- [x] El checkbox de autorización arranca marcado y se marca/desmarca al hacer click.
- [x] `Activá tu cuenta` navega a `/activate-account` y `Iniciar sesión` (de la activación) navega a `/login`.
- [x] Los botones `Iniciar sesión` (login) y `Activar mi cuenta` no navegan ni ejecutan acciones.
- [x] `¿Olvidaste tu contraseña?` no navega.
- [x] En viewport `< md` el login se apila en una columna, sin scroll horizontal.
- [x] `npm run lint` pasa sin errores.
- [x] `npx tsc --noEmit` pasa sin errores.
- [x] No hay errores en la consola del navegador al cargar `/login` y `/activate-account`.

## Decisions

- **Sí:** rutas `/login` y `/activate-account` en inglés, siguiendo el precedente de `/kids` (SPEC 02). **No:** `/activar-cuenta`.
- **Sí:** URLs en inglés, UI en español (`Iniciar sesión`, `CREAR CONTRASEÑA`). **No:** traducir los textos (rompería la coherencia con SPEC 01/02).
- **Sí:** botones principales sin navegación por ahora, dejando anotado en Scope que la redirección llega en una spec futura. **No:** apuntar a `/` (falsaría el flujo de auth) ni a `familia-feed` (no existe).
- **Sí:** pantalla completa sin `Sidebar` ni `MobileNav` en ambas rutas. **No:** conservar la hamburguesa de SPEC 01 (el template no la tiene).
- **Sí:** solo navegan los dos links de ida y vuelta entre las pantallas; el logout del sidebar sigue en `#`. **No:** modificar `Sidebar.tsx`/`MobileNav.tsx` (evita tocar specs ya implementadas).
- **Sí:** campos editables con `defaultValue` y checkbox con `useState` en `PhotoConsent.tsx` (client). **No:** controlar todo el formulario con estado (no hay submit) ni dejarlo mudo (checkbox que no togglea parece roto).
- **Sí:** `app/login/page.tsx` y `app/activate-account/page.tsx` como server components (solo `PhotoConsent` es client), con `metadata` propio. **No:** `"use client"` en las páginas completas.
- **Sí:** reusar el kid de `app/_data/kids.ts` para la tarjeta de invitación. **No:** duplicar `Mateo · Sala Soles` en el componente (riesgo de divergencia con `/kids`).
- **Sí:** fondo propio `#FBF4EC` en el contenedor de estas pantallas, como en los templates. **No:** cambiar el fondo global `#F6ECDF` del resto de la app.
- **Sí:** split apilado en `< md`. **No:** mantener 2 columnas siempre (scroll horizontal).
- **Sí:** `CheckIcon` agregado a `components/shared/icons.tsx`, como el resto de los SVG (SPEC 01). **No:** SVG inline dentro del componente.
- **Nota:** el usuario aprobó la spec por instrucción explícita ("implementalo, yo lo reviso en cuanto acabes") antes de releerla en el archivo; el estado se fija en `Approved` en consecuencia.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Eliminar el selector de rol hace que el calco se separe del template | Queda registrado en Scope/Decisions; el resto del markup se replica tal cual. |
| No existe screenshot de referencia en `references/screenshots/` para estas dos pantallas | La verificación es contra el HTML del template (`.dc.html`) y sus estilos inline. |
| El botón de login apuntaba en el template a `feed.dc.html` / `familia-feed.dc.html` | Decisión explícita: sin navegación; la redirección queda para una spec futura. |
| El fondo `#FBF4EC` choca con el `#F6ECDF` global al navegar desde `/` | Es intencional (fondo de pantalla de auth del template); no se toca `globals.css`. |
| El estado desmarcado del checkbox no está definido en el template | Se renderiza como caja blanca con borde `#D9C48A` (único estado visual inventado, derivado del texto `#8A7234`). |

## What is **not** in this spec

- Autenticación, sesiones, validación, persistencia y redirecciones post-login.
- Selector de rol `Personal` / `Familia`.
- Flujo de recuperación de contraseña.
- Conexión de `/login` con el resto de la app (logout, guards).
- Textos de UI en inglés.
- Pantalla `familia-feed` y el resto del catálogo.

Cada uno de esos, si llega, va en su propia spec.
