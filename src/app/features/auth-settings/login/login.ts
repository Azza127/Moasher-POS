import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,

  imports: [
    FormsModule,
    RouterLink
  ],

  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  // =========================================
  // Services
  // =========================================

  private userService = inject(UserService);

  private router = inject(Router);


  // =========================================
  // Form Data
  // =========================================

  username = '';

  password = '';


  // =========================================
  // UI State
  // =========================================

  showPassword = false;

  errorMessage = '';

  isLoading = false;


  // =========================================
  // Toggle Password
  // =========================================

  togglePassword(): void {

    this.showPassword = !this.showPassword;

  }


  // =========================================
  // Login
  // =========================================

  login(): void {

    // Clear previous error
    this.errorMessage = '';


    // =======================================
    // Get Form Values
    // =======================================

    const username = this.username.trim();

    const password = this.password.trim();


    // =======================================
    // Username Required
    // =======================================

    if (!username) {

      this.errorMessage =
        'Please enter your username.';

      return;
    }


    // =======================================
    // Username Validation
    // First character = letter
    // Rest = letters and numbers
    // =======================================

    const usernamePattern = /^[A-Za-z][A-Za-z0-9]*$/;

    if (!usernamePattern.test(username)) {

      this.errorMessage =
        'Username must start with a letter and contain only letters and numbers.';

      return;
    }


    // =======================================
    // Password Required
    // =======================================

    if (!password) {

      this.errorMessage =
        'Please enter your password.';

      return;
    }


    // =======================================
    // Loading
    // =======================================

    this.isLoading = true;


    // =======================================
    // Get Users
    // =======================================

    this.userService.getUsers().subscribe({

      // =====================================
      // Success
      // =====================================

      next: (users: User[]) => {

        console.log(
          'USERS FROM SERVER:',
          users
        );


        // ===================================
        // Find Matching User
        // ===================================

        const user = users.find(
          (u: User) =>
            u.username === username &&
            u.password === password
        );


        // ===================================
        // Invalid Login
        // ===================================

        if (!user) {

          this.isLoading = false;

          this.errorMessage =
            'Invalid username or password.';

          return;
        }


        // ===================================
        // Check User Status
        // ===================================

        if (user.status !== 'Active') {

          this.isLoading = false;

          this.errorMessage =
            'Your account is inactive. Please contact the administrator.';

          return;
        }


        // ===================================
        // Login Success
        // ===================================

        console.log(
          'LOGIN SUCCESS:',
          user
        );


        // ===================================
        // Save Login Status
        // ===================================

        localStorage.setItem(
          'isLoggedIn',
          'true'
        );


        // ===================================
        // Save Current User
        // Includes Role
        // ===================================

        localStorage.setItem(
          'currentUser',
          JSON.stringify(user)
        );


        // ===================================
        // Stop Loading
        // ===================================

        this.isLoading = false;


        // ===================================
        // Go To Dashboard
        // ===================================

        this.router.navigate([
          '/dashboard'
        ]);

      },


      // =====================================
      // Server Error
      // =====================================

      error: (error) => {

        console.error(
          'SERVER ERROR:',
          error
        );

        this.isLoading = false;

        this.errorMessage =
          'Unable to connect to JSON Server.';

      }

    });

  }

}