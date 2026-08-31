// import { Component, inject } from '@angular/core';
// import { Router } from '@angular/router';
// import { PopupService } from '../../../core/services/popup.service';
// import { StoreSettingsService } from '../../../core/services/store-settings.service';
// import { StoreSettings } from '../../../core/models/store-settings.model';
// @Component({
//   selector: 'app-header',
//   standalone: true,
//   templateUrl: './header.html',
//   styleUrl: './header.css'
// })
// export class HeaderComponent {

//   settings!: StoreSettings;

//   userName = 'Store Owner';
//   userRole = 'Owner';

//   constructor(
//     private router: Router,
//     private readonly popupService: PopupService,
//     private readonly settingService: StoreSettingsService
//   ) {

//     this.settingService.getSettings().subscribe({
//       next: (settings) => {
//         this.settings = settings[0];
//       }
//     });

//     const user = localStorage.getItem('currentUser');

//     if (user) {

//       const currentUser = JSON.parse(user);

//       this.userName = currentUser.name;
//       this.userRole = currentUser.role;

//     }
//   }


//   logout(): void {

//     this.popupService.showConfirm(
//       'Are you sure you want to logout?',
//       'logout'
//     ).subscribe({
//       next: (confirmed) => {
//         if (!confirmed) {
//           return;
//         }



//         localStorage.removeItem('currentUser');
//         localStorage.removeItem('isLoggedIn');

//         window.location.href = '/login';
//       }
//     });
//   }

// }


import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { PopupService } from '../../../core/services/popup.service';
import { StoreSettingsService } from '../../../core/services/store-settings.service';
import { StoreSettings } from '../../../core/models/store-settings.model';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent implements OnInit, AfterViewInit {

  // settings: StoreSettings = {
  //   id: 1,
  //   storeName: '',
  //   phone: '',
  //   address: '',
  //   currency: 'EGP',
  //   taxRate: 0
  // };
  settings: StoreSettings | null = null;

  userName = 'Store Owner';
  userRole = 'Owner';

  constructor(
    private router: Router,
    private readonly popupService: PopupService,
    private readonly settingService: StoreSettingsService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  ngAfterViewInit(): void {
    this.settingService.getCurrentSettings().subscribe({
      next: (settings) => {
        if (settings) {
          this.settings = settings;
          this.cdr.markForCheck();
        }
      }
    });

    this.settingService.getSettings().subscribe({
      next: (settings) => {
        if (settings.length > 0) {
          this.settings = settings[0];
          this.settingService.setCurrentSettings(settings[0]);
          this.cdr.markForCheck();
        }
      },
      error: (error) => {
        console.error(
          'Failed to load store settings:',
          error
        );
      }
    });
  }

  private loadCurrentUser(): void {

    const user = localStorage.getItem('currentUser');

    if (user) {

      const currentUser = JSON.parse(user);

      this.userName =
        currentUser.name || 'Store Owner';

      this.userRole =
        currentUser.role || 'Owner';
    }
  }

  logout(): void {

    this.popupService.showConfirm(
      'Are you sure you want to logout?',
      'logout'
    ).subscribe({
      next: (confirmed) => {

        if (!confirmed) {
          return;
        }

        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');

        window.location.href = '/login';
      }
    });
  }
}
