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
  otp: string[] = ['', '', '', '', '', ''];
  error: string = '';

  constructor(private http: HttpClient, private router: Router) { }

  onInput(event: any, index: number) {
    const input = event.target;
    const value = input.value;
    if (value.length > 1) {
      this.otp[index] = value.charAt(value.length - 1);
    } else {
      this.otp[index] = value;
    }
    if (value && index < 5) {
      const next = input.parentElement.querySelectorAll('.otp-input')[index + 1];
      if (next) next.focus();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Backspace' && !input.value && index > 0) {
      const prev = input.parentElement!.querySelectorAll('.otp-input')[index - 1] as HTMLInputElement;
      if (prev) prev.focus();
    }
  }

  onVerify() {
    const code = this.otp.join('');
    if (code.length !== 6) {
      this.error = 'Please enter the 6-digit code.';
      return;
    }
    this.http.post('http://localhost:8080/gallery/users/auth/validate-code', { code: code }, { responseType: 'text' })
      .subscribe(
        () => {
          localStorage.setItem('resetCode', code);
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