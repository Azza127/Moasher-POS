import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent {

  userName = 'Store Owner';
  userRole = 'Owner';

  constructor(
    private router: Router
  ) {

    const user = localStorage.getItem('currentUser');

    if (user) {

      const currentUser = JSON.parse(user);

      this.userName = currentUser.name;
      this.userRole = currentUser.role;

    }
  }


 logout(): void {

  const confirmed = confirm(
    'Are you sure you want to logout?'
  );

  if (!confirmed) {
    return;
  }

  localStorage.removeItem('currentUser');
  localStorage.removeItem('isLoggedIn');

  window.location.href = '/login';
}

}