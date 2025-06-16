import { Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-otp-verification',
  standalone: false,
  templateUrl: './otp-verification.component.html',
  styleUrls: ['./otp-verification.component.css']
})
export class OtpVerificationComponent implements OnInit {
  @ViewChildren('otpInput') inputs!: QueryList<ElementRef>;

  otpCode: string = '';
  identifier: string = '';
  useSms: boolean = false;
  message: string = '';
  error: string = '';
  isVerifying = false;
  isResending = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.identifier = params['identifier'] || '';
      this.useSms = params['useSms'] === 'true';

      if (!this.identifier) {
        this.router.navigate(['/register']);
        return;
      }

      // ✅ Don't call resend here — first-time OTP already sent from backend
      this.message = '📨 Please check your ' + (this.useSms ? 'phone' : 'email') + ' for the OTP.';
    });
  }

  maskIdentifier(): string {
    if (this.identifier.includes('@')) {
      const [name, domain] = this.identifier.split('@');
      return name.length <= 2
        ? '*@' + domain
        : name[0] + '*'.repeat(name.length - 2) + name[name.length - 1] + '@' + domain;
    } else {
      return this.identifier.slice(0, 4) + '***' + this.identifier.slice(-2);
    }
  }

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(0, 1);
    input.value = val;

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
    this.otpCode = this.inputs.map(input => input.nativeElement.value).join('');
  }

  verifyOtp(): void {
    if (!this.otpCode || this.otpCode.length < 6) {
      this.error = '❌ Please enter the OTP.';
      this.message = '';
      return;
    }

    this.isVerifying = true;

    this.userService.verifyOtp(this.identifier, this.otpCode).subscribe({
      next: (res: string) => {
        this.isVerifying = false;
        const normalized = res.toLowerCase().trim();

        if (normalized.includes('verified')) {
          this.message = res.includes('already')
            ? 'ℹ️ This account has already been verified.'
            : '✅ OTP verified successfully!';
          this.error = '';
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

    const resend$ = this.useSms
      ? this.userService.resendSmsOtp(this.identifier)
      : this.userService.resendEmailOtp(this.identifier);

    resend$.subscribe({
      next: () => {
        this.isResending = false;
        this.message = '📨 OTP has been resent successfully!';
        this.error = '';
      },
      error: err => {
        this.isResending = false;
        const msg = typeof err.error === 'string' ? err.error : '⚠️ OTP resend may have failed.';
        this.error = msg;
        this.message = '';
      }
    });
  }
}
