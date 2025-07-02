import {
  Component,
  ViewChild
} from '@angular/core';
import {
  trigger,
  transition,
  style,
  animate
} from '@angular/animations';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { User } from '../../user.model';
import { Terms, TermsService } from '../terms.service';

@Component({
  selector: 'app-user-register',
  standalone: false,
  templateUrl: './user-register.component.html',
  styleUrls: ['./user-register.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class UserRegisterComponent {
  @ViewChild('registerForm') registerForm!: NgForm;

  user: User = {
    id: 0,
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    imageUrls: [],
    gender: '',
    status: 0,
    roleId: 3,
    customerType: ''
  };

  selectedFiles: File[] = [];
  filePreviews: string[] = [];

  emailExists = false;
  phoneExists = false;
  showPassword = false;
  passwordStrength = '';
  isSubmitting = false;

  latestTerms: Terms | null = null;
   latestPrivacyPolicy: any = null;
   showTermsModal = false;
   showPrivacyPolicyModal = false;
  acceptedTerms = false;

  constructor(private http: HttpClient, private router: Router,private termsService:TermsService) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  checkPasswordStrength(password: string): void {
    if (password.length < 6) {
      this.passwordStrength = 'Weak';
    } else if (/[A-Z]/.test(password) && /[0-9]/.test(password)) {
      this.passwordStrength = 'Strong';
    } else {
      this.passwordStrength = 'Medium';
    }
  }

  removeImage(index: number): void {
    URL.revokeObjectURL(this.filePreviews[index]);
    this.selectedFiles.splice(index, 1);
    this.filePreviews.splice(index, 1);
  }

  onImagesSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.selectedFiles.push(...files);
    this.filePreviews.push(...files.map(file => URL.createObjectURL(file)));
    event.target.value = null;
  }

  onFilesDropped(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files) {
      this.onImagesSelected({ target: { files } } as any);
    }
  }
 openTermsModal(event: Event): void {
    event.preventDefault();
    this.termsService.getLatestTerms().subscribe({
      next: (terms) => {
        this.latestTerms = terms;
        this.showTermsModal = true;
      },
      error: () => {
        alert("Unable to load latest terms.");
      }
    });
  }

  closeTermsModal(): void {
    this.showTermsModal = false;
  }

 openPrivacyPolicyModal(event: Event): void {
  event.preventDefault();
  this.http.get('http://localhost:8080/api/privacy-policy/latest')
    .subscribe({
      next: (policy) => {
        this.latestPrivacyPolicy = policy;
        this.showPrivacyPolicyModal = true;
      },
      error: () => {
        alert('Unable to load latest privacy policy.');
      }
    });
}


  // Close the privacy policy modal
  closePrivacyPolicyModal(): void {
    this.showPrivacyPolicyModal = false;
  }
  
  register(): void {
    if (!this.registerForm.valid) {
      this.registerForm.control.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    let phone = this.user.phoneNumber.trim();
    if (phone.startsWith('+959')) {
      phone = phone.replace(/^(\+959)/, '09');
    }
    this.user.phoneNumber = phone;

    const formData = new FormData();
    formData.append('user', new Blob([JSON.stringify(this.user)], { type: 'application/json' }));

    if (this.selectedFiles.length > 0) {
      this.selectedFiles.forEach(file => {
        formData.append('images', file);
      });
    } else {
      formData.append('images', new Blob([], { type: 'application/octet-stream' }), '');
    }

    this.http.post('http://localhost:8080/gallery/users/register', formData).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res.message === 'User registered successfully') {
          localStorage.setItem('pendingEmail', this.user.email);
          this.router.navigate(['/choose-verification'], {
            queryParams: {
              email: this.user.email,
              phone: this.user.phoneNumber
            }
          });
          
        } else {
          alert(res.message);
        }
      },
      error: err => {
        this.isSubmitting = false;
        const msg = typeof err.error === 'string' ? err.error : err.error?.message || 'Something went wrong.';
        this.emailExists = msg.toLowerCase().includes("email");
        this.phoneExists = msg.toLowerCase().includes("phone");
        alert("⚠️ " + msg);
      }
    });
  }
}
