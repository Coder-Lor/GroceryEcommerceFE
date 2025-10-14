import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  router: Router = inject(Router);

  showPassword = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  exitLoginForm() {
    this.router.navigate(['/home']);
  }
}
