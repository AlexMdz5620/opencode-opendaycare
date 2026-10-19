---
description: Ensure a database spec's migrations exist as local mirror files and apply the pending ones to Supabase via MCP apply_migration.
agent: db-migrator
---

Ensure the migrations of the database spec exist and apply the pending ones: $ARGUMENTS

Run your full workflow (load Supabase skills → identify spec → audit remote vs local state → create missing mirror files for drift → apply pending via apply_migration with destructive-op confirmation → verify with list_migrations/advisors → final report).

`$ARGUMENTS` may be a number (`10`), a slug (`children-and-rooms-tables`), or a full name (`10-children-and-rooms-tables`). If it is empty, list `specs/database/` and ask which spec to migrate.
