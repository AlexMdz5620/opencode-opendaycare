---
description: Verify and mark a spec's acceptance criteria (code + UI + Next.js docs + screenshots).
agent: spec-verifier
---

Verify the acceptance criteria of the spec: $ARGUMENTS

Run your full workflow (identify spec → prepare env → verify each criterion with code/Context7/Playwright/vision → fix failing code → mark checks → final report).

`$ARGUMENTS` may be a number (`01`), a slug (`feed-as-home`), or a full name (`01-feed-as-home`). If it is empty, list the specs and ask which one to verify.
