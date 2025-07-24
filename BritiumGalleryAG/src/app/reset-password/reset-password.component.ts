import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
  code = '';
  error = '';

  constructor(private http: HttpClient, private router: Router) { }

  onVerify() {
    this.http.post('http://localhost:8080/gallery/users/auth/validate-code', { code: this.code }, { responseType: 'text' })
      .subscribe(
        () => {
          localStorage.setItem('resetCode', this.code);
          this.router.navigate(['/newpassword']);

        },
        err => {
          this.error = err.error?.message || 'Invalid or expired code.';
        }
      );
  }
  onResendCode() {
  const email = localStorage.getItem('resetEmail'); // store email during forgot-password
  if (!email) {
    this.error = 'Email not available. Please go back and try again.';
    return;
  }

  this.http.post('http://localhost:8080/gallery/users/auth/resend-code', { email }, { responseType: 'text' })
  
    .subscribe(
      () => {
        this.error = '';
        alert('Verification code resent! Check your email.');
      },
      err => {
        this.error = err.error?.message || 'Failed to resend code.';
      }
    );
}
}