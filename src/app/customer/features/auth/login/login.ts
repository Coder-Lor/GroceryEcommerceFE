import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/service/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  //declare router and service
  private router: Router = inject(Router);
  private authService: AuthService = inject(AuthService);

  errorMessage: string = '';

  //form fields
  @ViewChild('loginForm') form: NgForm | undefined;
  showPassword = false;

  onFormSubmitted() {
    // console.log(this.form);
    this.authService.login(this.form?.value).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.errorMessage = err.message;
      },
    });
    // this.uName = this.form?.value.emailOrUsername;
    // this.password = this.form?.value.password;
    // console.log(this.uName, this.password);
  }

  exitLoginForm() {
    this.router.navigate(['/home']);
  }
  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
