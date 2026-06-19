import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { ShellComponent } from './layout/shell.component';
import { LoginComponent } from './pages/login.component';
import { RegisterComponent } from './pages/register.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/dashboard.component').then((m) => m.DashboardComponent) },
      { path: 'factures', loadComponent: () => import('./pages/factures.component').then((m) => m.FacturesComponent) },
      { path: 'factures/nouvelle', loadComponent: () => import('./pages/new-invoice.component').then((m) => m.NewInvoiceComponent) },
      { path: 'factures/:id/modifier', loadComponent: () => import('./pages/new-invoice.component').then((m) => m.NewInvoiceComponent) },
      { path: 'factures/:id', loadComponent: () => import('./pages/invoice-detail.component').then((m) => m.InvoiceDetailComponent) },
      { path: 'clients', loadComponent: () => import('./pages/clients.component').then((m) => m.ClientsComponent) },
      { path: 'clients/nouveau', loadComponent: () => import('./pages/new-client.component').then((m) => m.NewClientComponent) },
      { path: 'clients/:id/modifier', loadComponent: () => import('./pages/new-client.component').then((m) => m.NewClientComponent) },
      { path: 'clients/:id', loadComponent: () => import('./pages/client-detail.component').then((m) => m.ClientDetailComponent) },
      { path: 'parametres', loadComponent: () => import('./pages/settings.component').then((m) => m.SettingsComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
