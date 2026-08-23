import { Routes } from '@angular/router';
import { Layout } from './shared/layout/layout';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard-reports/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/dashboard-reports/orders/orders').then(m => m.Orders)
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/dashboard-reports/reports/reports').then(m => m.Reports)
      }
    ]
  }
];