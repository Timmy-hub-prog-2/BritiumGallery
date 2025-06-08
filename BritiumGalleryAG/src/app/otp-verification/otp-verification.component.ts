import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../user.service';

@Component({
  selector: 'app-otp-verification',
  standalone: false,
  templateUrl: './otp-verification.component.html',
  styleUrls: ['./otp-verification.component.css']
})
export class OtpVerificationComponent {
  @ViewChildren('otpInput') inputs!: QueryList<ElementRef>;
  otpCode: string = '';
  email: string = '';
  message: string = '';
  error: string = '';
  isVerifying = false;
  isResending = false;

  constructor(private userService: UserService, private router: Router) {
    const storedEmail = localStorage.getItem('pendingEmail');
    this.email = storedEmail ?? '';
    if (!this.email) {
      this.router.navigate(['/register']);
    }
  }

  maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    return name.length <= 2
      ? '*@' + domain
      : name[0] + '*'.repeat(name.length - 2) + name[name.length - 1] + '@' + domain;
  }

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(0, 1); // keep only 1 digit
    input.value = val;

    // Move to next field
    if (val && index < this.inputs.length - 1) {
      this.inputs.toArray()[index + 1].nativeElement.focus();
    }

    this.updateOtpCode();
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = this.inputs.toArray()[index].nativeElement;

    if (event.key === 'Backspace') {
      if (!input.value && index > 0) {
        const prev = this.inputs.toArray()[index - 1].nativeElement;
        prev.value = '';
        prev.focus();
      } else {
        input.value = '';
      }

      this.updateOtpCode();
    }
  }

  updateOtpCode(): void {
    this.otpCode = this.inputs
      .toArray()
      .map(input => input.nativeElement.value)
      .join('');
  }

  verifyOtp(): void {
    if (!this.otpCode || this.otpCode.length < 6) {
      this.error = '❌ Please enter the OTP.';
      this.message = '';
      return;
    }

    this.isVerifying = true;

    this.userService.verifyOtp(this.email, this.otpCode).subscribe({
      next: (res: string) => {
        this.isVerifying = false;
        const normalized = res.toLowerCase().trim();

        if (normalized.includes('verified')) {
          this.message = res.includes('already')
            ? 'ℹ️ This email has already been verified.'
            : '✅ OTP verified successfully!';
          this.error = '';
          localStorage.removeItem('pendingEmail');
          setTimeout(() => this.router.navigate(['/login']), 2000);
        } else {
          this.error = `❌ Unexpected response: ${res}`;
          this.message = '';
        }
      },
      error: err => {
        this.isVerifying = false;
        const msg = typeof err.error === 'string' ? err.error : '❌ OTP verification failed.';
        this.error = msg;
        this.message = '';
      }
    });
  }

  resendOtp(): void {
    this.isResending = true;
    this.userService.resendOtp(this.email).subscribe({
      next: () => {
        this.isResending = false;
        this.error = '';
        this.message = '📨 OTP has been resent successfully!';
      },
      error: err => {
        this.isResending = false;
        const msg = typeof err.error === 'string' ? err.error : '⚠️ OTP may have sent, but failed to respond cleanly.';
        this.error = msg;
        this.message = '';
      }
    });
  }
}
