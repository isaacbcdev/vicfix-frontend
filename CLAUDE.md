# VicFix Frontend — Claude Context

## What this is

The Angular 21 frontend for VicFix, a management system for a family-owned
business in Sabanalarga, Atlántico, Colombia. The business has two sides:

1. **Store (tienda/miscelánea)** — school supplies, hair products, OTC
   medicines, snacks, handmade popsicles (politos), printing/scanning services
2. **Banking correspondent (corresponsal bancario)** — agent for platforms
   (PTM, Puntored, Refacil, Claro Pay, Nequi) handling cash withdrawals, bill
   payments, phone top-ups, transfers

The most critical workflow: when a customer asks to withdraw $200.000, the
cashier must answer in under 2 seconds — enough cash in drawer? enough
balance on the relevant platform? The Dashboard exists to answer this
question with a glance.

**Backend:** Spring Boot 3.4.4 + Java 21, deployed at `https://app.vicfix.shop`.
Pure JSON REST API on `/api/v1/**` with JWT bearer auth — no Thymeleaf, no
session login (the legacy MVC layer has been fully removed; see the
backend's own CLAUDE.md). Repo: `vicfix-inventory`.

**This frontend replaced:** The Thymeleaf templates the backend used to serve.
That migration is done — this is the live production UI at `www.vicfix.shop`.

## Stack

- Angular 21, standalone components, zoneless change detection
- Signals (writable, computed, effect, `input()`, `output()`)
- New control flow (`@if`, `@for`, `@empty`)
- `inject()` for all dependency injection — no constructor injection
- Tailwind CSS
- TypeScript strict mode
- JWT auth: access token in memory, refresh token in httpOnly cookie, silent
  refresh via interceptor (`shareReplay(1)` to dedupe concurrent refresh calls)
- Path aliases: `@shared/*`, `@environments/*`, `@features/*`, `@auth/*`

## Design system

- Sidebar background: `#0F172A`
- Primary accent (buttons, active states): `#059669` (emerald-600)
- App background: `#F1F5F9` (slate-100)
- Surface (cards): `#FFFFFF`
- Text primary: `#0F172A`
- Text secondary: `#64748B`
- Success: `#059669` · Warning: `#D97706` · Error: `#DC2626`
- Typography: Geist
- Language: Spanish (Colombia)
- Currency: Colombian peso, format `$251.000` (period thousands separator, no decimals) via `CurrencyCopPipe`
- Required fields: red `*` after label, always visible
- Mixed case text everywhere — never `text-transform: uppercase`

## Screen status

Shipped: Login, Productos, Nueva Venta (POS), Historial de Ventas,
Dashboard (platform balances + alerts), Plataformas Bancarias, Reportes
(5 tabs), Proveedores, Usuarios y Roles, Cierre del Día (wizard pattern,
in sidebar nav under Operación).

- **Productos**: full CRUD, plus `isService` flag support — service
  products hide stock/reorder/expiration fields (table, detail modal,
  product form), are excluded from supply creation (backend guard +
  frontend filtering), and show a distinct "Servicio" badge wherever
  product status is displayed. Also has category tabs, status filter
  pills, an "solo servicios" toggle, and a page-size selector on the
  product list.
- **Plataformas Bancarias**: per-platform detail view (balance, "Suficiente"/
  low-balance indicator, transaction history with Fecha/Operación/Tipo/
  Monto/Saldo ant./Saldo sig./Comisión/Cargo extra/Referencia columns),
  manual balance update, manual transaction create/edit/delete, and
  PTM/Refacil import. Backend maintains a chained `balanceBefore`/
  `balanceAfter` history — see "Out of scope" below for exactly which
  actions trigger recalculation.

**Puntored**: not yet integrated as an importable/scraped platform — blocked
on external account/device verification on Puntored's side, not a code gap.
Don't attempt to add Puntored import support without confirming access is
resolved.

## Design reference

Mockups generated in Claude Design are saved locally in
`~/vicfix-design-reference/`. Reference them when building. Do not commit
them to this repo — they are reference material, not source code.
(Confirm this path is still current before relying on it — verify with the
project owner if a referenced file isn't found.)

## Naming conventions

- Components: hyphen-case, no `.component.ts` suffix (`product-form.ts`, not
  `product-form.component.ts`).
- HTTP/data services: `*-api.ts` suffix (`products-api.ts`, `auth-api.ts`).
  This is the one and only convention for files that talk to the backend —
  don't introduce a `*.service.ts` HTTP service again.
- `confirm-dialog.service.ts` is correctly named as-is — it's not an HTTP
  service, so it doesn't follow the `-api` convention.
- Cross-feature imports use path aliases (`@auth/auth-api`), never deep
  relative paths (`../../../auth/auth-api`).

## Backend API

Base URL (dev): `http://localhost:8081`
Base URL (prod): `https://app.vicfix.shop`

JWT bearer auth, fully implemented:

- `POST /api/v1/auth/login` → access token + refresh cookie
- `POST /api/v1/auth/refresh` → reads refresh cookie, returns new access token
- `POST /api/v1/auth/logout` → revokes refresh token

Only `login`/`refresh`/`logout` are excluded from bearer-token stripping —
not the whole `/api/v1/auth/**` namespace. Don't widen that exclusion without
checking why it's scoped this tightly (it was a deliberate bug fix).

## Modals

`ModalComponent` accepts `closeOnBackdropClick` (default `true`). Set to
`false` for destructive dialogs (delete/cancel confirmations) and
in-progress forms (product edit, supply form, transaction edit/create) —
anywhere accidental data loss from a stray click matters. Leave default
`true` for read-only detail/view modals (product detail, supply detail,
sale detail). Don't add a new `<app-modal>` usage without deciding which
category it falls into.

## Out of scope (confirmed decisions, not gaps to silently "fix")

- PDF export — intentionally not in this frontend; the backend's PDF stack
  has also been removed entirely. Don't add either back without an explicit
  decision to do so.
- Excel export — backend's Excel export was removed along with the legacy
  MVC layer. Not currently reachable from this frontend.
- Sales receipt printing
- Biometric login / WebAuthn (future v2)
- Multi-tenant or SaaS features
- Native mobile app (this is a responsive web app)
- Expenses tracking — explicitly decided against, not a missing feature.
- Platform balance auto-computation from every code path — only these
  trigger recalculation of the balance chain: PTM import, Refacil import,
  manual transaction create/edit/delete, NEQUI sale **confirmation** (creates
  the platform transaction), and NEQUI sale **cancellation** (reverses it and
  re-chains). Cancelling a NEQUI sale correctly reverses its balance impact —
  confirmed working. Don't add new auto-recalc triggers without confirming
  with the backend first; per the backend's own audit, the chain has known
  gaps (no concurrency lock, zero-seed edge case on inserts before the
  earliest transaction) — treat any new balance-mutation code path as
  something to design carefully, not bolt on casually.
- Commission total (platform-detail) is computed via a full-range frontend
  fetch (`size=totalElements`), not a backend aggregate — fine at current
  volume, revisit if any platform's transaction count grows large enough to
  make that fetch expensive.

---

## Coding Rules

### 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

**Project-specific instances of this rule:**

- If a request implies touching the JWT refresh interceptor, the auth
  bearer-stripping exclusion list, or anything in `auth-api.ts`: confirm the
  exact current behavior first (read the file), don't assume how it works —
  this code has already had one subtle race-condition bug from a wrong
  assumption.
- If unsure whether a list component's data should be a signal vs. an
  Observable + `toSignal()`, default to: HTTP streams are Observables,
  component state is signals (see rule 3 below) — but say which you're
  choosing and why if it's not obvious.
- If a request touches platform balances or Nequi sale sync, read the
  backend's `PlatformServiceImpl` and its own CLAUDE.md first — this is the
  most intricate and currently under-tested logic in the system (per the
  backend audit: zero direct tests on the chain recalculation, and known
  edge cases around zero-seeding and concurrency). Don't assume frontend
  changes here are purely cosmetic.

### 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

**Project-specific instances of this rule:**

- No global state libraries (no NgRx, no Akita). Signals + services are
  sufficient at this app's scale — don't introduce one "for scalability."
- Don't build a generic/reusable abstraction for a single screen's needs.
  Match the existing pattern (services with signals, `forkJoin` for parallel
  loads) rather than inventing a new one.

### 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

**Project-specific instances of this rule:**

- Standalone components only, signals over Observables for component state,
  `inject()` over constructor injection, new control flow (`@if`/`@for`) —
  these are the established conventions. Match them; don't "modernize" a
  file that's already following them differently than you would.
- All API calls go through `*-api.ts` services — components never inject
  `HttpClient` directly. Don't add an exception for "just this one call."
- JWT access token stays in memory only, refresh token in the httpOnly
  cookie. Never store JWT in localStorage, even temporarily for debugging.
- Currency formatting goes through `CurrencyCopPipe` — never a hardcoded
  formatter, even inline for "just this one display."

### 4. Goal-Driven Execution

Define success criteria. Loop until verified.

- "Add validation" → "Write tests for invalid inputs, then make them pass."
- "Fix the bug" → "Write a test that reproduces it, then make it pass."
- "Refactor X" → "Ensure tests pass before and after."

For multi-step tasks, state a brief plan:

``` md
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

**Project-specific instances of this rule:**

- `ng build` must pass before any commit. One change at a time — one logical
  change per commit, conventional commit message, don't batch unrelated
  changes into one commit.
- Note: this repo currently ships zero automated tests. Until that changes,
  "verify" generally means a manual build pass + a stated manual check
  (e.g. "confirm the clear-button still toggles correctly") — say explicitly
  what you checked, don't just claim it works.

## Conventional commits

``` md
feat: add login page with JWT auth
fix: correct currency format in product list
refactor: extract product card to shared component
chore: update Angular dependencies
docs: add API integration notes
style: align dashboard cards
test: add product service unit tests
```

## General conventions

- English code, Spanish UI. Route paths, folder names, and code identifiers
  are English (`/products`, `ProductsComponent`). UI text and nav labels are
  Spanish (Productos, Nueva Venta). URLs mirror REST resources: `/products` ↔ `/api/v1/products`.
- Empty states are mandatory. Every list view must show a meaningful empty
  state with a primary action. Never render a bare empty table.
- No inline styles. Tailwind utility classes preferred; component CSS files
  only when Tailwind can't express it.

---

**These guidelines are working if:** fewer unnecessary changes in diffs,
fewer rewrites due to overcomplication, and clarifying questions come before
implementation rather than after mistakes.
