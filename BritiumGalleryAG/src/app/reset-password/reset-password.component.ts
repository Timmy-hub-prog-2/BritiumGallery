import { Component, OnInit, ElementRef, QueryList, ViewChildren, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit, AfterViewInit {
  @ViewChildren('otpInput') inputs!: QueryList<ElementRef>;
  
  otp: string[] = ['', '', '', '', '', ''];
  error: string = '';
  identifier: string = '';
  useSms: boolean = false;

  constructor(private http: HttpClient, private router: Router) { }



  ngOnInit(): void {
    // Get the identifier and method from localStorage
    const resetEmail = localStorage.getItem('resetEmail');
    const resetPhone = localStorage.getItem('resetPhone');
    const resetMethod = localStorage.getItem('resetMethod');

    if (resetEmail) {
      this.identifier = resetEmail;
      this.useSms = false;
    } else if (resetPhone) {
      this.identifier = resetPhone;
      this.useSms = true;
    } else {
      this.router.navigate(['/forgot-password']); // Redirect if no identifier found
    }
  }

  ngAfterViewInit(): void {
    // Attach paste handler to all inputs
    if (this.inputs) {
      this.inputs.forEach((input, index) => {
        input.nativeElement.addEventListener('paste', (e: ClipboardEvent) => this.onPaste(e));
      });
      
      // Also add paste event to the container for better UX
      const firstInput = this.inputs.first;
      if (firstInput) {
        const container = firstInput.nativeElement.closest('.otp-input-container');
        if (container) {
          container.addEventListener('paste', (e: ClipboardEvent) => this.onPaste(e));
        }
      }
      
      // Add paste event to the entire card for maximum coverage
      const card = firstInput?.nativeElement.closest('.otp-card');
      if (card) {
        card.addEventListener('paste', (e: ClipboardEvent) => this.onPaste(e));
      }
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') || '';
    
    // Extract only digits from pasted content
    const digits = pasted.replace(/\D/g, '').slice(0, 6).split('');
    
    if (digits.length === 0) {
      return;
    }
    
    // Clear all inputs first
    this.inputs.forEach((input, i) => {
      const value = digits[i] || '';
      input.nativeElement.value = value;
      this.otp[i] = value;
    });
    
    // Focus on the next empty input or the last one if all filled
    const nextEmptyIndex = digits.length < 6 ? digits.length : 5;
    if (this.inputs.toArray()[nextEmptyIndex]) {
      this.inputs.toArray()[nextEmptyIndex].nativeElement.focus();
    }
    
    // Auto-verify if all boxes are filled with valid digits
    if (this.otp.length === 6 && this.otp.every(d => d && d.match(/\d/))) {
      setTimeout(() => this.onVerify(), 100);
    } else if (this.otp.length === 6) {
      // Show error if 6 characters but not all digits
      this.error = '❌ Please enter a valid 6-digit OTP code.';
    }
  }

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
    if (!this.identifier) {
      this.error = 'No identifier available. Please go back and try again.';
      return;
    }

    const payload = this.useSms 
      ? { identifier: this.identifier, useSms: true }
      : { identifier: this.identifier, useSms: false };

    this.http.post('http://localhost:8080/gallery/users/auth/forgot-password', payload, { responseType: 'text' })
      .subscribe(
        () => {
          this.error = '';
          const method = this.useSms ? 'SMS' : 'email';
          alert(`Verification code resent! Check your ${method}.`);
        },
        err => {
          this.error = err.error?.message || 'Failed to resend code.';
        }
      );
  }
}