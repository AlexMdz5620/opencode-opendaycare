---
description: Diagnóstica y corrige accesibilidad WCAG 2.2 AA en archivos indicados (código + Playwright).
agent: accessibility-checker
---

Revisa y corrige la accesibilidad (WCAG 2.2 AA) de los siguientes archivos: $ARGUMENTS

Ejecuta tu flujo completo (parsear archivos → diagnóstico estático WCAG → verificación runtime con Playwright → corregir → validar `npm run lint` y `npx tsc --noEmit` → re-verificar la UI si cambiaste algo → reporte final citando los criterios WCAG).

`$ARGUMENTS` debe contener rutas separadas por espacios o comas (ej. `app/page.tsx components/login/LoginForm.tsx`). Si está vacío, muestra los archivos del proyecto y pregunta cuáles revisar.
