import { Routes } from '@angular/router';
import { AuthLayout } from './layout/auth-layout/auth-layout';
import { LoginComponent as Login } from './login/login';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        component: Login,
      },

      {
        path: '**',
        redirectTo: 'login',
      },
    ],
  },
];

export default AUTH_ROUTES;
