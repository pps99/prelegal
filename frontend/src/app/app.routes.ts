import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/signup/signup.component').then(m => m.SignupComponent),
  },
  {
    path: 'documents',
    loadComponent: () =>
      import('./pages/documents/documents-page.component').then(m => m.DocumentsPageComponent),
    canActivate: [authGuard],
  },
  {
    path: '',
    loadComponent: () =>
      import('./pages/nda/nda-page.component').then(m => m.NdaPageComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
];
