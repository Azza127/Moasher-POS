import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PopupService } from '../../../core/services/popup.service';
import { StoreSettingsService } from '../../../core/services/store-settings.service';
import { StoreSettings } from '../../../core/models/store-settings.model';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent {
  settings!: StoreSettings;
  userName = 'Store Owner';
  userRole = 'Owner';

  constructor(
    private router: Router,
    private readonly popupService: PopupService,
    private readonly settingService: StoreSettingsService
  ) {

    this.settingService.getSettings().subscribe({
      next: (settings) => {
        this.settings = settings[0];
      }
    });

    const user = localStorage.getItem('currentUser');

    if (user) {

      const currentUser = JSON.parse(user);

      this.userName = currentUser.name;
      this.userRole = currentUser.role;

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