import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-choose-verification',
  standalone: false,
  templateUrl: './choose-verification.component.html',
  styleUrls: ['./choose-verification.component.css']
})
export class ChooseVerificationComponent {
  email: string = '';
  phone: string = '';
  isLoading: boolean = false;
  selectedMethod: 'email' | 'sms' | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.phone = params['phone'] || '';
    });
  }

  async chooseEmail() {
    if (this.isLoading) return;
    
    this.selectedMethod = 'email';
    this.isLoading = true;
    
    try {
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.router.navigate(['/otp-verification'], {
        queryParams: { identifier: this.email, useSms: false }
      });
    } catch (error) {
      console.error('Navigation error:', error);
      this.isLoading = false;
      this.selectedMethod = null;
    }
  }

  async chooseSms() {
    if (this.isLoading) return;
    
    this.selectedMethod = 'sms';
    this.isLoading = true;
    
    try {
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.router.navigate(['/otp-verification'], {
        queryParams: { identifier: this.phone, useSms: true }
      });
    } catch (error) {
      console.error('Navigation error:', error);
      this.isLoading = false;
      this.selectedMethod = null;
    }
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
