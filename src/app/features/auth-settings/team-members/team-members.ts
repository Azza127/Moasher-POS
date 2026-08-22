import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { User } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-members.html',
  styleUrl: './team-members.css'
})
export class TeamMembers implements OnInit {

  // =========================
  // SERVICE
  // =========================

  private readonly userService = inject(UserService);


  // =========================
  // USERS
  // =========================

  users: User[] = [];


  // =========================
  // MODAL
  // =========================

  showModal = false;

  isEditMode = false;

  selectedUserId: string | null = null;


  // =========================
  // USER FORM
  // =========================

  userForm = {

    username: '',

    password: '',

    name: '',

    role: 'Employee' as User['role'],

    status: 'Active' as User['status']

  };


  // =========================
  // INIT
  // =========================

  ngOnInit(): void {

    this.loadUsers();

  }


  // =========================
  // LOAD USERS
  // =========================

  loadUsers(): void {

    this.userService.getUsers().subscribe({

      next: (users) => {

        this.users = users;

        console.log('USERS:', users);

      },

      error: (error) => {

        console.error(
          'GET USERS ERROR:',
          error
        );

      }

    });

  }


  // =========================
  // CURRENT USER
  // =========================

  getCurrentUser(): User | null {

    const currentUserData =
      localStorage.getItem('currentUser');

    if (!currentUserData) {

      return null;

    }

    try {

      return JSON.parse(
        currentUserData
      ) as User;

    } catch (error) {

      console.error(
        'CURRENT USER ERROR:',
        error
      );

      return null;

    }

  }


  // =========================
  // CURRENT ROLE
  // =========================

  getCurrentRole(): User['role'] | null {

    const currentUser =
      this.getCurrentUser();

    if (!currentUser) {

      return null;

    }

    return currentUser.role;

  }


  // =========================
  // PERMISSIONS
  // =========================

  // Manager + Owner
  canAddUser(): boolean {

    const role =
      this.getCurrentRole();

    return (
      role === 'Owner' ||
      role === 'Manager'
    );

  }


  // Manager + Owner
  canEditUser(): boolean {

    const role =
      this.getCurrentRole();

    return (
      role === 'Owner' ||
      role === 'Manager'
    );

  }


  // Manager + Owner
  canDeleteUser(): boolean {

    const role =
      this.getCurrentRole();

    return (
      role === 'Owner' ||
      role === 'Manager'
    );

  }


  // =========================
  // LIVE NAME VALIDATION
  // =========================

  getNameError(): string {

    const name =
      this.userForm.name.trim();

    if (!name) {

      return '';

    }

    const namePattern =
      /^[A-Za-z]+(?: [A-Za-z]+)*$/;

    if (!namePattern.test(name)) {

      return 'Name must contain letters and spaces only.';

    }

    return '';

  }


  // =========================
  // LIVE USERNAME VALIDATION
  // =========================

  getUsernameError(): string {

    const username =
      this.userForm.username.trim();

    if (!username) {

      return '';

    }


    // First character must be a letter

    if (!/^[A-Za-z]/.test(username)) {

      return 'Username must start with a letter.';

    }


    // Letters and numbers only

    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(username)) {

      return 'Username can contain only letters and numbers.';

    }


    // Duplicate username

    const usernameExists =
      this.users.some(user =>

        user.username.toLowerCase() ===
        username.toLowerCase() &&

        user.id !== this.selectedUserId

      );


    if (usernameExists) {

      return 'Username already exists.';

    }


    return '';

  }


  // =========================
  // LIVE PASSWORD VALIDATION
  // =========================

  getPasswordError(): string {

    const password =
      this.userForm.password;

    if (!password) {

      return '';

    }


    if (password.length < 6) {

      return 'Password must be at least 6 characters.';

    }


    return '';

  }


  // =========================
  // OPEN ADD MODAL
  // =========================

  openAddModal(): void {

    if (!this.canAddUser()) {

      alert(
        'You do not have permission to add users.'
      );

      return;

    }


    this.isEditMode = false;

    this.selectedUserId = null;


    this.userForm = {

      username: '',

      password: '',

      name: '',

      role: 'Employee',

      status: 'Active'

    };


    this.showModal = true;

  }


  // =========================
  // OPEN EDIT MODAL
  // =========================

  openEditModal(user: User): void {

    if (!this.canEditUser()) {

      alert(
        'Only the Owner or Manager can edit users.'
      );

      return;

    }


    this.isEditMode = true;

    this.selectedUserId = user.id;


    this.userForm = {

      username: user.username,

      password: user.password,

      name: user.name,

      role: user.role,

      status: user.status

    };


    this.showModal = true;

  }


  // =========================
  // CLOSE MODAL
  // =========================

  closeModal(): void {

    this.showModal = false;

    this.selectedUserId = null;

  }


  // =========================
  // SAVE USER
  // =========================

  saveUser(): void {

    // =========================
    // PERMISSION
    // =========================

    if (this.isEditMode) {

      if (!this.canEditUser()) {

        alert(
          'Only the Owner or Manager can edit users.'
        );

        return;

      }

    } else {

      if (!this.canAddUser()) {

        alert(
          'You do not have permission to add users.'
        );

        return;

      }

    }


    // =========================
    // CLEAN VALUES
    // =========================

    const name =
      this.userForm.name.trim();

    const username =
      this.userForm.username.trim();

    const password =
      this.userForm.password.trim();


    // =========================
    // REQUIRED
    // =========================

    if (
      !name ||
      !username ||
      !password
    ) {

      alert(
        'Please fill all required fields.'
      );

      return;

    }


    // =========================
    // NAME VALIDATION
    // =========================

    const namePattern =
      /^[A-Za-z]+(?: [A-Za-z]+)*$/;

    if (!namePattern.test(name)) {

      alert(
        'Name must contain letters and spaces only.'
      );

      return;

    }


    // =========================
    // USERNAME VALIDATION
    // =========================

    const usernamePattern =
      /^[A-Za-z][A-Za-z0-9]*$/;

    if (!usernamePattern.test(username)) {

      alert(
        'Username must start with a letter and contain only letters and numbers.'
      );

      return;

    }


    // =========================
    // PASSWORD VALIDATION
    // =========================

    if (password.length < 6) {

      alert(
        'Password must be at least 6 characters.'
      );

      return;

    }


    // =========================
    // DUPLICATE USERNAME
    // =========================

    const usernameExists =
      this.users.some(user =>

        user.username.toLowerCase() ===
        username.toLowerCase() &&

        user.id !== this.selectedUserId

      );


    if (usernameExists) {

      alert(
        'Username already exists. Please choose another username.'
      );

      return;

    }


    // =========================
    // EDIT
    // =========================

    if (
      this.isEditMode &&
      this.selectedUserId !== null
    ) {

      const updatedUser: User = {

        id: this.selectedUserId,

        username: username,

        password: password,

        name: name,

        role: this.userForm.role,

        status: this.userForm.status

      };


      this.userService
        .updateUser(updatedUser)
        .subscribe({

          next: () => {

            console.log(
              'USER UPDATED:',
              updatedUser
            );

            this.loadUsers();

            this.closeModal();

          },

          error: (error) => {

            console.error(
              'UPDATE USER ERROR:',
              error
            );

            alert(
              'Failed to update user.'
            );

          }

        });


      return;

    }


    // =========================
    // ADD
    // =========================

    const newUser: Omit<User, 'id'> = {

      username: username,

      password: password,

      name: name,

      role: this.userForm.role,

      status: this.userForm.status

    };


    this.userService
      .addUser(newUser)
      .subscribe({

        next: (createdUser) => {

          console.log(
            'USER ADDED:',
            createdUser
          );

          this.loadUsers();

          this.closeModal();

        },

        error: (error) => {

          console.error(
            'ADD USER ERROR:',
            error
          );

          alert(
            'Failed to add user.'
          );

        }

      });

  }


  // =========================
  // DELETE USER
  // =========================

  deleteUser(user: User): void {

    if (!this.canDeleteUser()) {

      alert(
        'Only the Owner or Manager can delete users.'
      );

      return;

    }


    // =========================
    // PREVENT SELF DELETE
    // =========================

    const currentUser =
      this.getCurrentUser();


    if (
      currentUser &&
      currentUser.id === user.id
    ) {

      alert(
        'You cannot delete your own account.'
      );

      return;

    }


    // =========================
    // CONFIRM
    // =========================

    const confirmed =
      confirm(
        `Are you sure you want to delete ${user.name}?`
      );


    if (!confirmed) {

      return;

    }


    // =========================
    // DELETE
    // =========================

    this.userService
      .deleteUser(user.id)
      .subscribe({

        next: () => {

          console.log(
            'USER DELETED:',
            user
          );

          this.users =
            this.users.filter(
              u => u.id !== user.id
            );

        },

        error: (error) => {

          console.error(
            'DELETE USER ERROR:',
            error
          );

          alert(
            'Failed to delete user.'
          );

        }

      });

  }

}