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
import { ForgotPassword } from './features/auth-settings/forgot-password/forgot-password';


export const routes: Routes = [


  {
    path: 'login',
    component: Login
  },

  {
  path: 'forgot-password',
  component: ForgotPassword
},

  
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

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: '**',
    redirectTo: 'login'
  }

];