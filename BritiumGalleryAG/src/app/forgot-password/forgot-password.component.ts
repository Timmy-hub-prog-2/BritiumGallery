import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {

  email = '';
  message = '';
  error = '';

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit() {
    this.http
      .post('http://localhost:8080/gallery/users/auth/forgot-password', { email: this.email }, { responseType: 'text' })
      .subscribe({
        next: (res) => {
          this.message = res;
          this.error = '';

          // Navigate to reset-password after short delay (optional)
          setTimeout(() => {
            this.router.navigate(['/reset-password']);
          }, 1000); // 1-second delay for user to read the message
        },
        error: () => {
          this.error = 'Something went wrong. Try again.';
          this.message = '';
        }
      });
  }
}