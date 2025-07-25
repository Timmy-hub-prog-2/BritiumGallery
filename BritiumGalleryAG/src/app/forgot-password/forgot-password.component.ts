import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

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
  if (!this.email) return;
  Swal.fire({
    title: 'Sending email...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
  this.http
    .post('http://localhost:8080/gallery/users/auth/forgot-password', { email: this.email }, { responseType: 'text' })
    .subscribe({
      next: (res) => {
        Swal.close();
        this.message = res;
        this.error = '';

        // ✅ Store the email for use in reset code & resend
        localStorage.setItem('resetEmail', this.email);

        // ✅ Navigate to reset-password after short delay (optional)
        setTimeout(() => {
          this.router.navigate(['/reset-password']);
        }, 1000); // 1-second delay for user to read the message
      },
      error: (err) => {
        Swal.close();
        this.error = err.error?.message || 'Failed to send email.';
        this.message = '';
      }
    });
}
}