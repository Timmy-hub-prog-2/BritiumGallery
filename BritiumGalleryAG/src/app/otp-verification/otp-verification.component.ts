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
  resendCooldown: number = 30; // 30 seconds cooldown
  canResend: boolean = false;
  private countdownInterval: any;
  private hasResentOnce: boolean = false; // Track if user has clicked resend before

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
      this.message = '📱 Please check your ' + (this.useSms ? 'phone' : 'email') + ' for the OTP.';
      
      // Don't start countdown immediately - let user click resend first
      this.canResend = true; // Allow resend immediately on first load
    });
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  startResendCooldown(): void {
    this.canResend = false;
    this.resendCooldown = 30;
    
    this.countdownInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        this.canResend = true;
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  getResendButtonText(): string {
    if (this.isResending) {
      return 'Sending...';
    }
    if (this.canResend) {
      return 'Resend Code';
    }
    return `Resend Code (${this.resendCooldown}s)`;
  }

  getResendButtonClass(): string {
    if (this.isResending) {
      return 'btn-secondary loading';
    }
    if (this.canResend) {
      return 'btn-secondary';
    }
    return 'btn-secondary disabled';
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
    // Auto-verify if all boxes are filled
    if (this.otpCode.length === 6 && this.otpCode.split('').every(d => d.match(/\d/))) {
      this.verifyOtp();
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
    });
    
    this.updateOtpCode();
    
    // Focus on the next empty input or the last one if all filled
    const nextEmptyIndex = digits.length < 6 ? digits.length : 5;
    if (this.inputs.toArray()[nextEmptyIndex]) {
      this.inputs.toArray()[nextEmptyIndex].nativeElement.focus();
    }
    
    // Auto-verify if all boxes are filled with valid digits
    if (this.otpCode.length === 6 && this.otpCode.split('').every(d => d.match(/\d/))) {
      setTimeout(() => this.verifyOtp(), 100);
    } else if (this.otpCode.length === 6) {
      // Show error if 6 characters but not all digits
      this.error = '❌ Please enter a valid 6-digit OTP code.';
      this.message = '';
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

          // Fetch user profile after verification
          this.userService.getUserProfileByIdentifier(this.identifier).subscribe({
            next: (user) => {
              // Store user in localStorage
              localStorage.setItem('loggedInUser', JSON.stringify(user));
              // Redirect based on role
              const roleId = user.roleId;
              if (roleId === 1 || roleId === 2 || roleId === 4 || roleId === 5 || roleId === 6) {
                this.router.navigate(['/admin-dashboard']);
              } else {
                this.router.navigate(['/customer-homepage']);
              }
            },
            error: () => {
              // fallback: go to login if cannot fetch user
              setTimeout(() => this.router.navigate(['/login']), 2000);
            }
          });
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
      ? this.userService.resendSmsOtpResend(this.identifier)
      : this.userService.resendEmailOtpResend(this.identifier);

    resend$.subscribe({
      next: () => {
        this.isResending = false;
        this.message = '📨 OTP has been resent successfully!';
        this.error = '';
        // Start countdown only after first successful resend
        this.hasResentOnce = true;
        this.startResendCooldown();
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
