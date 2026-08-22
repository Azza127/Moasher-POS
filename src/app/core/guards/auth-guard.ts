import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard = () => {

  const router = inject(Router);

  const isLoggedIn = localStorage.getItem('isLoggedIn');

  if (isLoggedIn === 'true') {
    return true;
  }

  return router.createUrlTree(['/login']);
};