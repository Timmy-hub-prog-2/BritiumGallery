import { Component, ViewChild } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { User } from '../../user.model';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-user-register',
  standalone: false,
  templateUrl: './user-register.component.html',
  styleUrls: ['./user-register.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate(
          '500ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
  ],
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
    customerType: '',
  };

  selectedFile: File | null = null;
  filePreview: string | null = null;

  emailExists = false;
  emailNotVerified = false;
  phoneExists = false;
  emailValidationShown = false;
  phoneValidationShown = false;
  nameValidationShown = false;
  passwordValidationShown = false;
  formSubmitted = false;

  showPassword = false;
  passwordStrength = '';
  isSubmitting = false;
  termsInteracted = false;
  genderInteracted = false;

  acceptedTerms = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private userService: UserService
  ) {}

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

  removeImage(): void {
    if (this.filePreview) {
      URL.revokeObjectURL(this.filePreview);
    }
    this.selectedFile = null;
    this.filePreview = null;
  }

  onImagesSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.removeImage();
      const file = files[0];
      this.selectedFile = file;
      this.filePreview = URL.createObjectURL(file);
    }
    event.target.value = null;
  }

  onFilesDropped(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const fileList = { 0: files[0], length: 1 };
      this.onImagesSelected({ target: { files: fileList } } as any);
    }
  }

  onTermsChange(): void {
    this.termsInteracted = true;
  }

  onTermsInteracted(): void {
    this.termsInteracted = true;
  }

  onFieldBlur(field: any): void {
    if (field.value && field.markAsDirty) {
      field.markAsDirty();
    }
  }

  onEmailBlur(field: any): void {
    // Only show validation when user has finished entering email and left the field
    if (field.value && field.value.trim() !== '') {
      this.emailValidationShown = true;
      if (field.markAsTouched) {
        field.markAsTouched();
      }
      if (field.markAsDirty) {
        field.markAsDirty();
      }
    }
  }

  onPhoneBlur(field: any): void {
    // Only show validation when user has finished entering phone and left the field
    if (field.value && field.value.trim() !== '') {
      this.phoneValidationShown = true;
      if (field.markAsTouched) {
        field.markAsTouched();
      }
      if (field.markAsDirty) {
        field.markAsDirty();
      }
    }
  }

  onNameBlur(field: any): void {
    // Only show validation when user has finished entering name and left the field
    if (field.value && field.value.trim() !== '') {
      this.nameValidationShown = true;
      if (field.markAsTouched) {
        field.markAsTouched();
      }
      if (field.markAsDirty) {
        field.markAsDirty();
      }
    }
  }

  onPasswordBlur(field: any): void {
    // Only show validation when user has finished entering password and left the field
    if (field.value && field.value.trim() !== '') {
      this.passwordValidationShown = true;
      if (field.markAsTouched) {
        field.markAsTouched();
      }
      if (field.markAsDirty) {
        field.markAsDirty();
      }
    }
  }

  onGenderChange(): void {
    this.genderInteracted = true;
  }

  register(): void {
    // Always show all validation errors when form is submitted
    this.formSubmitted = true;
    this.nameValidationShown = true;
    this.emailValidationShown = true;
    this.passwordValidationShown = true;
    this.phoneValidationShown = true;
    this.genderInteracted = true;
    this.termsInteracted = true;
    this.registerForm.control.markAllAsTouched();

    if (!this.acceptedTerms) {
      return;
    }

    if (!this.registerForm.valid) {
      return;
    }

    this.isSubmitting = true;

    let phone = this.user.phoneNumber.trim();
    if (phone.startsWith('+959')) {
      phone = phone.replace(/^(\+959)/, '09');
    }
    this.user.phoneNumber = phone;

    const userData = {
      ...this.user,
      id: 0,
      status: 0,
      roleId: 3,
      imageUrls: [],
      address: '',
      customerType: '',
      totalSpend: 0,
      isOnline: false,
      lastSeenAt: new Date().toISOString(),
    };

    const formData = new FormData();
    formData.append(
      'user',
      new Blob([JSON.stringify(userData)], { type: 'application/json' })
    );

    if (this.selectedFile) {
      formData.append('images', this.selectedFile);
    } else {
      formData.append(
        'images',
        new Blob([], { type: 'application/octet-stream' }),
        ''
      );
    }

    this.http
      .post('http://localhost:8080/gallery/users/register', formData)
      .subscribe({
        next: (res: any) => {
          this.isSubmitting = false;
          if (res.message === 'User registered successfully') {
            localStorage.setItem('pendingEmail', this.user.email);
            this.router.navigate(['/choose-verification'], {
              queryParams: {
                email: this.user.email,
                phone: this.user.phoneNumber,
              },
            });
          }
        },
        error: (err) => {
          this.isSubmitting = false;

          // Reset flags
          this.emailExists = false;
          this.emailNotVerified = false;
          this.phoneExists = false;

          let msg = 'Something went wrong. Please try again.';

          if (err.error) {
            if (typeof err.error === 'string') {
              msg = err.error;
            } else if (err.error.message) {
              msg = err.error.message;
            } else if (err.error.error) {
              msg = err.error.error;
            }
          }

          const lowerMsg = msg.toLowerCase();

          // Match backend error messages
          if (
            lowerMsg.includes('email already exists') ||
            lowerMsg.includes('email is already registered') ||
            lowerMsg.includes('email already registered')
          ) {
            this.emailExists = true;
          } else if (
            lowerMsg.includes('not deliverable') ||
            lowerMsg.includes('not verified') ||
            lowerMsg.includes('invalid email') ||
            lowerMsg.includes('please provide a valid one')
          ) {
            this.emailNotVerified = true;
          }

          if (
            lowerMsg.includes('phone already exists') ||
            lowerMsg.includes('phone already registered')
          ) {
            this.phoneExists = true;
          }

          console.log('Error message:', msg);
          console.log('Email exists:', this.emailExists);
          console.log('Phone exists:', this.phoneExists);
          console.log('Email not verified:', this.emailNotVerified);
        },
      });
  }
}
