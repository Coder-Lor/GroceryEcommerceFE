import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/service/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  router: Router = inject(Router);
  private authService: AuthService = inject(AuthService);

  @ViewChild('registerForm') form: NgForm | undefined;

  errorMessage: string = '';
  showPassword = false;

  onFormSubmitted() {
    this.authService.register(this.form?.value).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        this.errorMessage = err.message;
      },
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  exitLoginForm() {
    this.router.navigate(['/home']);
  }
}
