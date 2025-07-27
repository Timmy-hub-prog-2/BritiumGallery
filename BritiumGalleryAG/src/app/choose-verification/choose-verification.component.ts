import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-choose-verification',
  standalone: false,
  templateUrl: './choose-verification.component.html',
  styleUrls: ['./choose-verification.component.css']
})
export class ChooseVerificationComponent {
  email: string = '';
  phone: string = '';
  userData: any = null;
  isLoading: boolean = false;
  selectedMethod: 'email' | 'sms' | null = null;
  error: string = '';

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private userService: UserService
  ) {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.phone = params['phone'] || '';
      // Get user data from state if available
      const state = history.state;
      if (state && state.userData) {
        this.userData = state.userData;
      }
    });
  }

  async chooseEmail() {
    if (this.isLoading) return;
    
    this.selectedMethod = 'email';
    this.isLoading = true;
    this.error = '';
    
    try {
      if (this.userData) {
        // Register user with email verification
        await this.registerUserWithChoice(false);
      } else {
        // Send email OTP first, then navigate to verification page
        await this.sendOtpAndNavigate(this.email, false);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      this.error = 'Failed to send email verification. Please try again.';
      this.isLoading = false;
      this.selectedMethod = null;
    }
  }

  async chooseSms() {
    if (this.isLoading) return;
    
    this.selectedMethod = 'sms';
    this.isLoading = true;
    this.error = '';
    
    try {
      if (this.userData) {
        // Register user with SMS verification
        await this.registerUserWithChoice(true);
      } else {
        // Send SMS OTP first, then navigate to verification page
        await this.sendOtpAndNavigate(this.phone, true);
      }
    } catch (error) {
      console.error('SMS verification error:', error);
      this.error = 'Failed to send SMS verification. Please try again.';
      this.isLoading = false;
      this.selectedMethod = null;
    }
  }

  private async registerUserWithChoice(useSms: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userService.registerUserWithVerification(this.userData, useSms).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Navigate to OTP verification with the chosen method
          const identifier = useSms ? this.phone : this.email;
          this.router.navigate(['/otp-verification'], {
            queryParams: { identifier, useSms }
          });
          resolve();
        },
        error: (error) => {
          this.isLoading = false;
          this.selectedMethod = null;
          this.error = 'Registration failed. Please try again.';
          reject(error);
        }
      });
    });
  }

  private async sendOtpAndNavigate(identifier: string, useSms: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      // Send OTP via the chosen method
      const otpRequest$ = useSms 
        ? this.userService.resendSmsOtp(identifier)
        : this.userService.resendEmailOtp(identifier);

      otpRequest$.subscribe({
        next: () => {
          this.isLoading = false;
          // Navigate to OTP verification page
          this.router.navigate(['/otp-verification'], {
            queryParams: { identifier, useSms }
          });
          resolve();
        },
        error: (error) => {
          this.isLoading = false;
          this.selectedMethod = null;
          const method = useSms ? 'SMS' : 'email';
          this.error = `Failed to send ${method} verification. Please try again.`;
          reject(error);
        }
      });
    });
  }

  getEmailOptionClass(): string {
    const baseClass = 'verification-option email-option';
    if (this.selectedMethod === 'email' && this.isLoading) {
      return `${baseClass} loading`;
    }
    return baseClass;
  }

  getSmsOptionClass(): string {
    const baseClass = 'verification-option sms-option';
    if (this.selectedMethod === 'sms' && this.isLoading) {
      return `${baseClass} loading`;
    }
    return baseClass;
  }
}
