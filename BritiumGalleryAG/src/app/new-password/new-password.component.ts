import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-password',
  standalone: false,
  templateUrl: './new-password.component.html',
  styleUrl: './new-password.component.css'
})
export class NewPasswordComponent implements OnInit {
  code = '';
  newPassword = '';
  confirmPassword = '';
  message = '';
  error = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    // Read the code from localStorage (reliable even after page refresh)
    const savedCode = localStorage.getItem('resetCode');
    if (savedCode) {
      this.code = savedCode;
    } else {
      this.router.navigate(['/reset']); // Redirect if no code found
    }
  }

  onSubmit() {
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    const payload = { code: this.code, newPassword: this.newPassword };

    this.http.post(
      'http://localhost:8080/gallery/users/auth/reset-password',
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        responseType: 'text'
      }
    ).subscribe(
      () => {
        this.message = 'Password reset successful';
        localStorage.removeItem('resetCode'); 
        localStorage.removeItem('resetEmail'); // ✅ Remove the code after success
        setTimeout(() => this.router.navigate(['/login']), 2000); // Redirect to login page
      },
      err => {
        this.error = err.error?.message || 'Failed to reset password.';
      }
    );
  }
}
