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
  phone = '';
  message = '';
  error = '';
  selectedMethod: 'email' | 'sms' | null = null;
  isLoading = false;

  constructor(private http: HttpClient, private router: Router) {}

  onArrowClick(method: 'email' | 'sms', event: Event) {
    event.stopPropagation();
    if (method === 'email') {
      this.chooseEmail();
    } else {
      this.chooseSms();
    }
  }



  chooseEmail() {
    if (this.isLoading) return;
    
    this.selectedMethod = 'email';
    this.isLoading = true;
    this.error = '';
    
    if (!this.email || this.email.trim() === '') {
      this.error = 'Please enter your email address.';
      this.isLoading = false;
      this.selectedMethod = null;
      return;
    }

    Swal.fire({
      title: 'Sending email...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.http
      .post('http://localhost:8080/gallery/users/auth/forgot-password', { 
        identifier: this.email, 
        useSms: false 
      }, { responseType: 'text' })
      .subscribe({
        next: (res) => {
          Swal.close();
          this.message = res;
          this.error = '';
          this.isLoading = false;

          // Store the email for use in reset code & resend
          localStorage.setItem('resetEmail', this.email);
          localStorage.setItem('resetMethod', 'email');

          // Navigate to reset-password after short delay
          setTimeout(() => {
            this.router.navigate(['/reset-password']);
          }, 2000);
        },
        error: (err) => {
          Swal.close();
          this.error = err.error || 'Failed to send reset code. Please try again.';
          this.message = '';
          this.isLoading = false;
          this.selectedMethod = null;
        }
      });
  }

  chooseSms() {
    if (this.isLoading) return;
    
    this.selectedMethod = 'sms';
    this.isLoading = true;
    this.error = '';
    
    if (!this.phone || this.phone.trim() === '') {
      this.error = 'Please enter your phone number.';
      this.isLoading = false;
      this.selectedMethod = null;
      return;
    }

    Swal.fire({
      title: 'Sending SMS...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.http
      .post('http://localhost:8080/gallery/users/auth/forgot-password', { 
        identifier: this.phone, 
        useSms: true 
      }, { responseType: 'text' })
      .subscribe({
        next: (res) => {
          Swal.close();
          this.message = res;
          this.error = '';
          this.isLoading = false;

          // Store the phone for use in reset code & resend
          localStorage.setItem('resetPhone', this.phone);
          localStorage.setItem('resetMethod', 'sms');

          // Navigate to reset-password after short delay
          setTimeout(() => {
            this.router.navigate(['/reset-password']);
          }, 2000);
        },
        error: (err) => {
          Swal.close();
          this.error = err.error || 'Failed to send reset code. Please try again.';
          this.message = '';
          this.isLoading = false;
          this.selectedMethod = null;
        }
      });
  }

  getEmailOptionClass(): string {
    if (this.isLoading && this.selectedMethod === 'email') {
      return 'verification-option loading';
    }
    return this.selectedMethod === 'email' ? 'verification-option selected' : 'verification-option';
  }

  getSmsOptionClass(): string {
    if (this.isLoading && this.selectedMethod === 'sms') {
      return 'verification-option loading';
    }
    return this.selectedMethod === 'sms' ? 'verification-option selected' : 'verification-option';
  }
}