import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@auth/auth.guard';
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
        path: 'platforms',
        loadComponent: () =>
          import('@features/platforms/platforms').then((m) => m.PlatformsComponent),
      },
      {
        path: 'reports',
        loadComponent: () => import('@features/reports/reports').then((m) => m.ReportsComponent),
      },
      {
        path: 'close',
        loadComponent: () => import('@features/close/close').then((m) => m.CloseComponent),
      },
      {
        path: 'suppliers',
        loadComponent: () =>
          import('@features/suppliers/suppliers').then((m) => m.SuppliersComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('@features/users/users').then((m) => m.UsersComponent),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('@features/not-found/not-found').then((m) => m.NotFoundComponent),
  },
];
