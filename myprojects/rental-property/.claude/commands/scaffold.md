# /scaffold

Scaffold a new module for the rental property project.

## Usage
```
/scaffold <module-name> [type]
```
Types: `page`, `component`, `api`, `model`

## What to do

1. Read `CLAUDE.md` to understand the current stack and conventions.
2. Based on the `type` argument:
   - **page** — create a new route/page component in the appropriate pages directory; wire it into the router
   - **component** — create a reusable UI component; follow existing component conventions
   - **api** — add a new Express route file, controller, and mount it in the server entry point
   - **model** — create a new database model/schema file; add any required migrations
3. If `type` is omitted, ask the user which type they want.
4. Match naming, folder placement, and code style of existing files.
5. Do not add placeholder comments or TODO stubs — either implement it or leave it minimal and working.
