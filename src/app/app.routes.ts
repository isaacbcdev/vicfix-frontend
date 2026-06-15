import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from '@auth/auth.guard';
import { ShellComponent } from '@shared/layout/shell/shell';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('@features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'products',
        loadComponent: () => import('@features/products/products').then((m) => m.ProductsComponent),
      },
      {
        path: 'sales',
        loadComponent: () => import('@features/sales/sales').then((m) => m.SalesComponent),
      },
      {
        path: 'sales/history',
        loadComponent: () =>
          import('@features/sales/sales-history/sales-history').then(
            (m) => m.SalesHistoryComponent,
          ),
      },
      {
        path: 'platforms',
        canActivate: [roleGuard(['ROLE_ADMIN', 'ROLE_ROOT'])],
        loadComponent: () =>
          import('@features/platforms/platforms').then((m) => m.PlatformsComponent),
      },
      {
        path: 'reports',
        loadComponent: () => import('@features/reports/reports').then((m) => m.ReportsComponent),
      },
      {
        path: 'close',
        canActivate: [roleGuard(['ROLE_ADMIN', 'ROLE_ROOT'])],
        loadComponent: () => import('@features/close/close').then((m) => m.CloseComponent),
      },
      {
        path: 'supplies',
        canActivate: [roleGuard(['ROLE_ADMIN', 'ROLE_ROOT'])],
        loadComponent: () =>
          import('@features/supplies/supplies').then((m) => m.SuppliesComponent),
      },
      {
        path: 'suppliers',
        canActivate: [roleGuard(['ROLE_ADMIN', 'ROLE_ROOT'])],
        loadComponent: () =>
          import('@features/suppliers/suppliers').then((m) => m.SuppliersComponent),
      },
      {
        path: 'users',
        canActivate: [roleGuard(['ROLE_ROOT'])],
        loadComponent: () => import('@features/users/users').then((m) => m.UsersComponent),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('@features/not-found/not-found').then((m) => m.NotFoundComponent),
  },
];
