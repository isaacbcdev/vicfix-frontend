# VicFix Frontend — Claude Context

## What this is

The Angular 21 frontend for VicFix, a management system for a family-owned business in Sabanalarga, Atlántico, Colombia. The business has two sides:

1. **Store (tienda/miscelánea)** — school supplies, hair products, OTC medicines, snacks, handmade popsicles (politos), printing/scanning services
2. **Banking correspondent (corresponsal bancario)** — agent for 5 platforms (PTM, Puntored, Refacil, Claro Pay, Nequi) handling cash withdrawals, bill payments, phone top-ups, transfers

The most critical workflow: when a customer asks to withdraw $200.000, the cashier must answer in under 2 seconds — enough cash in drawer? enough balance on the relevant platform? The Dashboard exists to answer this question with a glance.

**Backend:** A separate Spring Boot 3.4.4 + Java 21 application deployed at `https://app.vicfix.shop`. Production-ready, fully refactored. Repo: `vicfix-inventory`.

**This frontend replaces:** The Thymeleaf templates currently served by the Spring Boot backend.

## Stack

- Angular 21 with standalone components
- Signals (writable, computed, effect, input, output)
- New control flow (`@if`, `@for`, `@empty`)
- Tailwind CSS
- TypeScript strict mode
- JWT authentication with refresh token in httpOnly cookie
- Path aliases: `@shared/*`, `@environments/*`, `@features/*`

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
- Currency: Colombian peso, format `$251.000` (period thousands separator, no decimals)
- Required fields: red `*` after label, always visible
- Mixed case text everywhere — never `text-transform: uppercase`

## Screen build priority

1. Login
2. Productos list (read-only first, then CRUD)
3. Nueva Venta POS
4. Dashboard (depends on V10 backend migration for platform balances)
5. Plataformas Bancarias (needs V10)
6. Reportes
7. Cierre del Día (wizard pattern)
8. Proveedores
9. Usuarios y Roles

## Design reference

Mockups generated in Claude Design are saved locally in `~/vicfix-design-reference/`. Reference them when building. Do not commit them to this repo — they are reference material, not source code.

## Rules for this project

1. **One change at a time.** Make one logical change, commit with conventional commit message, then move on. Do not batch unrelated changes.
2. **Standalone components only.** No NgModules. This is Angular 21 — embrace it.
3. **Signals over Observables for component state.** Use Observables for HTTP streams, signals for reactive state. Bridge with `toSignal()`.
4. **No global state libraries.** No NgRx, no Akita. Signals + services are sufficient for this app's scale.
5. **Tailwind utility classes preferred.** Custom CSS only when Tailwind cannot express it.
6. **No inline styles.** Use Tailwind or component CSS files.
7. **Currency formatting via a pipe.** Create `CurrencyCopPipe` for `$251.000` format and use it everywhere — no hardcoded formatters.
8. **All API calls go through services.** Components never inject `HttpClient` directly.
9. **JWT lives in memory + httpOnly cookie.** Access token in memory (signal in AuthService), refresh token in httpOnly cookie set by backend. Never store JWT in localStorage.
10. **Empty states are mandatory.** Every list view must show a meaningful empty state with a primary action. Never render a bare empty table.
11. **English code, Spanish UI.** Route paths, folder names, and code identifiers are English (`/products`, `ProductsComponent`). UI text and nav labels are Spanish (Productos, Nueva Venta). URLs mirror REST resources: `/products` ↔ `/api/products`.

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

## Backend API

Base URL (dev): `http://localhost:8081`
Base URL (prod): `https://app.vicfix.shop`

Currently session-based auth. **JWT endpoint must be added to backend** before Angular can consume the API:

- `POST /api/auth/login` → returns access token + sets refresh cookie
- `POST /api/auth/refresh` → reads refresh cookie, returns new access token
- `POST /api/auth/logout` → invalidates refresh cookie

CORS must allow `http://localhost:4200` in dev and `https://[angular-deploy-url]` in prod.

## Out of scope

- PDF export (intentionally removed from the Angular version — current backend has it, the new frontend will not)
- Sales receipt printing
- Biometric login / WebAuthn (future v2)
- Multi-tenant or SaaS features
- Native mobile app (this is a responsive web app)
