# AGENTS.md: open-daycare

## Commands

| Action                  | Command         |
| ----------------------- | --------------- |
| Start dev server        | `npm run dev`   |
| Build for production    | `npm run build` |
| Start production server | `npm run start` |
| Lint                    | `npm run lint`  |

## Framework notes

- **Next.js 16.3.6** — this version has breaking changes. APIs, conventions, and file structure may differ from older Next.js training data. Check `node_modules/next/dist/docs/` for the guide before writing code.
- **Tailwind CSS v4** — installed but config is minimal (`postcss.config.mjs`). Class names in `app/` use Tailwind v4 syntax (e.g., `bg-zinc-50`, `dark:bg-black`). Do not assume v3 patterns.
- **App directory** — `app/page.tsx` is the home entrypoint. `app/layout.tsx` sets up `Geist` font variables. New pages go in `app/`.
- **ESLint** — config in `eslint.config.mjs`. Ignores `.next/`, `out/`, `build/`. Runs via `npm run lint`.

## MCP configs

- Playwright tests must use the `.playwright-mcp` folder.
- Context7 MCP is used to fetch framework documentation.

## Quick setup

1. `npm install` to install dependencies
2. `npm run dev` starts the dev server at `http://localhost:3000`
3. Edit `app/page.tsx` to modify the home page

## Spec Driven Development - Skills

- /spec Usaremos esta habilidad para crear las especificaciones.
- /spec-impl Usaremos esta skill para hacer las implementaciones.

## Reglas de código

- Usa código limpio, nombres, funciones, variables, etc. en inglés.
