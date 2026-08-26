import { Component } from '@angular/core';
<<<<<<< HEAD
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
=======
import { Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar';
import { HeaderComponent } from './shared/components/header/header';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    SidebarComponent,
    HeaderComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  constructor(public router: Router) {}

  get isAuthPage(): boolean {
    return (
      this.router.url === '/login' ||
      this.router.url === '/forgot-password'
    );
  }
}
>>>>>>> origin/feature/auth-settings
