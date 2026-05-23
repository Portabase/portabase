# Portabase — Agent & Contributor Guidelines

Rules for AI agents and contributors working in this codebase.
These conventions are non-negotiable — follow them in all new code and refactors.

---

## Project Stack

- **Framework**: Next.js 15 (App Router)
- **ORM**: Drizzle ORM
- **Auth**: better-auth
- **UI**: shadcn/ui (Radix UI primitives) + Tailwind CSS
- **Forms**: react-hook-form + Zod
- **Package manager**: pnpm

---

## Architecture: Feature-Based

All business logic and UI are co-located by **domain feature**, not by file type or route.

### `src/` top-level structure

```
src/
├── components/
│   ├── ui/          # shadcn primitives — DO NOT hand-edit, auto-generated
│   ├── common/      # shared app-level UI composites (no actions, no DB)
│   └── emails/      # email templates
├── db/              # centralized DB: schema/, services/, migrations/, utils/
├── features/        # all business features (see Feature List below)
├── fonts/
├── hooks/           # ONLY truly global hooks (≤5 files total)
├── lib/             # infrastructure: auth, email, tasks, logger, acl, safe-actions
├── middleware/
├── types/
└── utils/           # pure utility functions + init/
```

### Import direction — strictly enforced

```
app/ → features/ → components/common/ → components/ui/
                 → lib/
                 → db/
```

- Features **do not import each other**. Cross-feature data flows through `app/` page props or `db/services/`.
- `lib/` has **no feature imports** — infrastructure only, no UI.
- `db/` has **no feature imports** — pure data access.
- `components/common/` has **no actions and no DB imports** — pure UI composites only.

---

## Feature List

Each feature lives at `src/features/<feature-name>/`.

| Feature | Domain |
|---------|--------|
| `agents` | Agent management, API keys |
| `auth` | Login, register, forgot/reset password, guard |
| `database` | DB backup/restore, health, retention, cron, channels-policy |
| `layout` | Dashboard shell: sidebar, header, nav, profile nav |
| `migration` | Organization data migration tool |
| `notifications` | Notification channels, dispatch, providers, logs |
| `organizations` | Org management, members, tabs, combobox, cookie |
| `profile` | User profile, 2FA, password, avatar |
| `projects` | Project management |
| `settings` | Admin settings: email, storage, notification config |
| `statistics` | Dashboard charts and stats |
| `storages` | Storage channels, dispatch, providers |
| `theme` | Dark/light mode toggle, browser meta updater |
| `updates` | App update checks (GitHub releases) |
| `upload` | TUS file upload action |
| `users` | Admin user management (list, add, edit, delete, roles) |
| `channel` | Generic channel card/form/modal UI + `notifications/` and `storages/` provider sub-folders |

---

## Naming Conventions

### Files — kebab-case everywhere, no exceptions

| Type | Pattern | Example |
|------|---------|---------|
| Server action | `<noun>.action.ts` | `agents.action.ts` |
| Zod schema | `<noun>.schema.ts` | `login-form.schema.ts` |
| Types | `<noun>.types.ts` | `notifications.types.ts` |
| React hook | `use-<noun>.ts` | `use-agent-update-check.ts` |
| React component | `<noun>.tsx` | `agent-card.tsx` |
| Service / helper | `<noun>.ts` | `notifications.dispatch.ts` |
| Provider backend | `<provider>.ts` | `discord.ts` |
| Provider form | `<provider>.form.tsx` | `discord.form.tsx` |
| Provider schema | `<provider>.schema.ts` | `discord.schema.ts` |

### Banned patterns

- **PascalCase filenames** — use `header.tsx`, not `Header.tsx`
- **Repeated segment names** — use flat `login-form.tsx`, not `login-form/login-form.tsx`
- **Typos in file/folder names** — fix on sight: `organisation` → `organization`, `apperance` → `appearance`, `heath` → `health`, `colums` → `columns`
- **Duplicate extensions** — if `use-x.ts` and `use-x.tsx` both exist, keep `.tsx`, delete `.ts`

### Folders — sub-folders only when justified

Create a sub-folder inside a feature **only when ≥3 files of the same type exist**.

✅ `features/notifications/providers/` — justified (8 providers × 3 files each)
❌ `features/agents/hooks/` — not justified (1 hook → goes flat in feature root)
❌ `features/agents/components/` — not justified (few components → goes flat)

---

## Feature Internal Shape

```
features/<feature-name>/
  <feature>.action.ts       # server actions
  <feature>.schema.ts       # zod schemas
  <feature>.types.ts        # TS types (if needed)
  <noun>-<descriptor>.tsx   # components
  use-<noun>.ts             # hooks
  <noun>.ts                 # services / helpers
  providers/                # sub-folder only when volume justifies
```

---

## Import Aliases

Use `@/` for all src imports.

```ts
// Good
import { AgentCard } from "@/features/agents/agent-card"
import { DataTable } from "@/components/common/data-table"
import { Button } from "@/components/ui/button"
import { db } from "@/db"

// Bad
import { AgentCard } from "../../../features/agents/agent-card"
```

---

## Import Updates on File Moves

**Critical**: When moving or renaming any file, update **all import references** across the entire codebase before committing. Use a global search (`grep -r` or IDE find-in-files) for the old path. Missing imports cause build failures.

Checklist when moving a file:
1. Move the file to new path
2. `grep -r "old/path" ./src ./app` — find all importers
3. Update every import to new path
4. Verify `pnpm build` passes before committing

---

## DB Layer

- **`src/db/schema/`** — Drizzle table definitions, numbered `00_` to `NN_`. Never modify migration files.
- **`src/db/services/`** — Data access functions. One file per domain entity. No UI imports.
- **`src/db/migrations/`** — Auto-generated by Drizzle. Never hand-edit.
- **`src/db/utils/`** — Shared DB utility helpers.

---

## `lib/` — Infrastructure Only

| Path | Purpose |
|------|---------|
| `lib/auth/` | better-auth config, client, permissions, current-user |
| `lib/acl/` | Organization ACL |
| `lib/email/` | Email sending infrastructure |
| `lib/safe-actions/` | Type-safe server action wrapper |
| `lib/tasks/` | Background cron tasks (cleaning, DB retention) |
| `lib/event.ts` | Global EventEmitter singleton |
| `lib/logger.ts` | Pino/structured logger |
| `lib/utils.ts` | `cn()` and generic utilities |
| `lib/zod.ts` | Shared Zod extensions |

---

## `components/common/` — Shared UI Composites

Re-usable UI components used across ≥2 features. Must:
- Have no server actions
- Have no direct DB imports
- Be feature-agnostic

If a component is only used in one feature → put it in that feature, not here.

---

## `app/` — Routing Only

`app/` pages and layouts should be thin. They:
- Fetch data and pass as props
- Compose feature components
- Handle route-level loading/error states

No business logic in `app/` — delegate to features.
