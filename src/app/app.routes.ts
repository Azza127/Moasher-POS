import { Routes } from '@angular/router';

import { Login }
  from './features/auth-settings/login/login';

import { DashboardComponent }
  from './features/dashboard-reports/dashboard/dashboard';

import { ProductsComponent }
  from './features/products/products';

import { PosComponent }
  from './features/pos/pos';

import { Reports }
  from './features/dashboard-reports/reports/reports';

import { Orders }
  from './features/dashboard-reports/orders/orders';

import { SettingsComponent }
  from './features/auth-settings/store-settings/settings';

import { TeamMembers }
  from './features/auth-settings/team-members/team-members';

import { authGuard }
  from './core/guards/auth-guard';

import { roleGuard }
  from './core/guards/role.guard';


export const routes: Routes = [

  // =========================================
  // LOGIN
  // =========================================
  {
    path: 'login',
    component: Login
  },


  // =========================================
  // DASHBOARD
  // EMPLOYEE + MANAGER + OWNER
  // =========================================
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [
      authGuard,
      roleGuard
    ],
    data: {
      roles: [
        'Employee',
        'Manager',
        'Owner'
      ]
    }
  },


  // =========================================
  // INVENTORY
  // MANAGER + OWNER
  // =========================================
  {
    path: 'inventory',
    component: ProductsComponent,
    canActivate: [
      authGuard,
      roleGuard
    ],
    data: {
      roles: [
        'Manager',
        'Owner'
      ]
    }
  },


  // =========================================
  // POS
  // EMPLOYEE + MANAGER + OWNER
  // =========================================
  {
    path: 'pos',
    component: PosComponent,
    canActivate: [
      authGuard,
      roleGuard
    ],
    data: {
      roles: [
        'Employee',
        'Manager',
        'Owner'
      ]
    }
  },


  // =========================================
  // REPORTS
  // MANAGER + OWNER
  // =========================================
  {
    path: 'reports',
    component: Reports,
    canActivate: [
      authGuard,
      roleGuard
    ],
    data: {
      roles: [
        'Manager',
        'Owner'
      ]
    }
  },


  // =========================================
  // ORDERS
  // MANAGER + OWNER
  // =========================================
  {
    path: 'orders',
    component: Orders,
    canActivate: [
      authGuard,
      roleGuard
    ],
    data: {
      roles: [
        'Manager',
        'Owner'
      ]
    }
  },


  // =========================================
  // TEAM MEMBERS
  // MANAGER + OWNER
  // =========================================
  {
    path: 'team-members',
    component: TeamMembers,
    canActivate: [
      authGuard,
      roleGuard
    ],
    data: {
      roles: [
        'Manager',
        'Owner'
      ]
    }
  },


  // =========================================
  // STORE SETTINGS
  // OWNER ONLY
  // =========================================
  {
    path: 'store-settings',
    component: SettingsComponent,
    canActivate: [
      authGuard,
      roleGuard
    ],
    data: {
      roles: [
        'Owner'
      ]
    }
  },


  // =========================================
  // DEFAULT
  // =========================================
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },


  // =========================================
  // NOT FOUND
  // =========================================
  {
    path: '**',
    redirectTo: 'login'
  }

];