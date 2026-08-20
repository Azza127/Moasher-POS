import { Routes } from '@angular/router';
import { Products } from './features/products/products';
import { Categories } from './features/categories/categories';
import { PosComponent } from './features/pos/pos.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full',
  },
  {
    path: 'products',
    component: Products,
  },
  {
    path: 'categories',
    component: Categories,
  },
  {
    path: 'pos',
    component: PosComponent,
  },
];
