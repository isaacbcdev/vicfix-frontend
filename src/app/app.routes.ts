import { Routes } from '@angular/router';
import { ShellComponent } from '@shared/layout/shell/shell';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('@features/login/login').then(m => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    // canActivate: [AuthGuard] — add here when AuthService/JWT is ready
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('@features/dashboard/dashboard').then(m => m.DashboardComponent),
      },
      {
        path: 'productos',
        loadComponent: () => import('@features/productos/productos').then(m => m.ProductosComponent),
      },
      {
        path: 'ventas',
        loadComponent: () => import('@features/ventas/ventas').then(m => m.VentasComponent),
      },
      {
        path: 'plataformas',
        loadComponent: () => import('@features/plataformas/plataformas').then(m => m.PlataformasComponent),
      },
      {
        path: 'reportes',
        loadComponent: () => import('@features/reportes/reportes').then(m => m.ReportesComponent),
      },
      {
        path: 'cierre',
        loadComponent: () => import('@features/cierre/cierre').then(m => m.CierreComponent),
      },
      {
        path: 'proveedores',
        loadComponent: () => import('@features/proveedores/proveedores').then(m => m.ProveedoresComponent),
      },
      {
        path: 'usuarios',
        loadComponent: () => import('@features/usuarios/usuarios').then(m => m.UsuariosComponent),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('@features/not-found/not-found').then(m => m.NotFoundComponent),
  },
];
