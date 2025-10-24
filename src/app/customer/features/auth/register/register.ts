import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  router: Router = inject(Router);

  showPassword = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  exitLoginForm() {
    this.router.navigate(['/home']);
  }
}
