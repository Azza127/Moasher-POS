import { Component } from '@angular/core';
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

  get isLoginPage(): boolean {
    return this.router.url === '/login';
  }
}