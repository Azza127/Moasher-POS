import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import { User } from '../models/user.model';


export const roleGuard: CanActivateFn = (route) => {

  const router = inject(Router);


  // =========================================
  // GET CURRENT USER
  // =========================================

  const currentUserData =
    localStorage.getItem('currentUser');


  // No logged-in user
  if (!currentUserData) {

    return router.createUrlTree(['/login']);

  }


  // =========================================
  // PARSE USER
  // =========================================

  let currentUser: User;

  try {

    currentUser =
      JSON.parse(currentUserData) as User;

  } catch {

    localStorage.removeItem('currentUser');

    localStorage.removeItem('isLoggedIn');

    return router.createUrlTree(['/login']);

  }


  // =========================================
  // CURRENT ROLE
  // =========================================

  const currentRole =
    String(currentUser.role)
      .trim()
      .toLowerCase();


  // =========================================
  // ALLOWED ROLES
  // =========================================

  const allowedRoles =
    route.data?.['roles'] as string[] | undefined;


  // No roles specified
  if (
    !allowedRoles ||
    allowedRoles.length === 0
  ) {

    return true;

  }


  // =========================================
  // CHECK PERMISSION
  // =========================================

  const hasPermission =
    allowedRoles.some(
      role =>
        role.trim().toLowerCase() === currentRole
    );


  // =========================================
  // ALLOWED
  // =========================================

  if (hasPermission) {

    return true;

  }


  // =========================================
  // DENIED
  // =========================================

  alert(
    'You do not have permission to access this page.'
  );

  return router.createUrlTree(['/dashboard']);

};