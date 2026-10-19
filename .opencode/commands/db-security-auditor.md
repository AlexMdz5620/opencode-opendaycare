---
description: Audit the Supabase DB for data leaks between children/parents (misconfigured RLS/roles) + security best practices; prove with simulated JWTs and remediate after confirmation.
agent: db-security-auditor
---

Audita la seguridad de la base de datos (fugas de datos entre niños y padres por RLS/roles mal configurados y buenas prácticas Supabase): $ARGUMENTS

Ejecuta tu flujo completo (cargar skills Supabase → definir alcance → inventario read-only de políticas/RLS → checklist de fugas → pruebas de fuga simulando JWTs de parent/staff/anon → remediación vía apply_migration solo tras confirmación explícita → verificación post-fix → reporte final con evidencias).

`$ARGUMENTS` puede ser una lista de tablas (`children invitations`), un foco (`parents`, `roles`, `tenant`, `invitations`) o quedar vacío para auditar todas las tablas de `public`.
