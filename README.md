# VicFix Frontend

Angular 21 frontend for VicFix, a management system for a family-owned business in Sabanalarga, Atlántico, Colombia. Replaces a Thymeleaf MVC app with a modern SPA.

## Live demo

[Link will be added after deployment]

## Backend

Spring Boot 3.4.4 REST API deployed at https://app.vicfix.shop

## Tech stack

- Angular 21 — standalone components, signals, zoneless change detection
- Tailwind CSS
- TypeScript strict mode
- JWT authentication — access token in memory, refresh token in httpOnly cookie with rotation and reuse detection
- Reactive forms
- RxJS — Observables for HTTP, signals for component state, rxResource for reactive data fetching

## Features built

- **Login** — JWT auth with session restore on reload
- **Productos** — paginated list with search, full CRUD via modal form
- **Nueva Venta** — POS screen with cart, real-time totals, payment method selection
- **Proveedores** — supplier management with active/inactive filter and restore action
- **Usuarios** — user management with RBAC role assignment and status toggle
- **Reportes** — five report tabs: ventas por producto, financiero, inventario, categorías, flujo de caja

## Architecture decisions worth noting

- **Signals over NgRx** — no global state library; signals + services are sufficient for this app's scale
- **Zoneless** — Angular 21 zoneless change detection enabled
- **JWT in memory** — access token never written to localStorage; refresh token in httpOnly cookie only
- **RBAC** — permissions flow through roles, not directly to users
- **Lazy loading** — every feature route is lazy-loaded
- **rxResource** — used for reactive search (Nueva Venta product search re-fetches automatically when query signal changes)

## Project structure

```
src/app/
  auth/
    login/           — Login component
    auth-api.ts      — AuthService (token in memory, session restore)
    auth.guard.ts    — authGuard + guestGuard
    auth.interceptor.ts — JWT bearer token injection
    auth.models.ts   — LoginResponse, User, LoginResult types
  shared/
    layout/shell/    — Shell component (sidebar + header + router-outlet)
    pipes/           — CurrencyCopPipe (Colombian peso: $251.000)
    ui/modal/        — Reusable ModalComponent
    models/          — Shared domain models (Product, Page)
  features/
    products/        — Product list + CRUD modal
    sales/           — Nueva Venta POS
    suppliers/       — Supplier management
    users/           — User management with roles
    reports/         — Five report tabs wired to backend
    dashboard/       — Placeholder (pending V10 platform migration)
    platforms/       — Placeholder (pending V10 platform migration)
    close/           — Placeholder (Cierre del Día, pending V10)
```

## Getting started

Prerequisites: Node 22, Angular CLI 21

```bash
npm install
ng serve --port 4200
```

Backend must be running locally on port 8081, or update `src/environments/environment.ts` to point at the production API.

## Deploying to Vercel

Connect this repo to Vercel with these settings:

| Setting | Value |
|---|---|
| Framework preset | Other |
| Build command | `npm run build` |
| Output directory | `dist/vicfix-frontend/browser` |
| Install command | `npm install` |

`vercel.json` handles SPA routing — no HashLocationStrategy needed.
