import { Component } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-change-password',
  standalone: false,
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css'],
})
export class ChangePasswordComponent {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  errorMessage = '';
  successMessage = '';
  loading = false;
  userId!: number;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const user = localStorage.getItem('loggedInUser'); // Or get from auth service
    if (user) {
      this.userId = JSON.parse(user).id;
    } else {
      this.errorMessage = 'You must be logged in to change your password.';
    }
  }

  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  hasUppercase(): boolean {
    return !!(this.newPassword && /[A-Z]/.test(this.newPassword));
  }

  hasLowercase(): boolean {
    return !!(this.newPassword && /[a-z]/.test(this.newPassword));
  }

  hasNumber(): boolean {
    return !!(this.newPassword && /[0-9]/.test(this.newPassword));
  }

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  changePassword() {
    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Please fill all fields.';
      this.loading = false;
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = "New password and confirm password don't match.";
      this.loading = false;
      return;
    }

    console.log('Calling changePassword API with:', {
      userId: this.userId,
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword,
    });

    this.userService
      .changePassword(
        this.userId,
        this.currentPassword,
        this.newPassword,
        this.confirmPassword
      )
      .subscribe({
        next: (response) => {
          console.log('Change password response:', response);
          this.successMessage = response.message || JSON.stringify(response);
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.loading = false;
        },
        error: (err: any) => {
          console.log('Change password error full:', err);
          this.errorMessage =
            err.error || 'Failed to change password. Try again.';
          this.loading = false;
        },
      });
  }
}
