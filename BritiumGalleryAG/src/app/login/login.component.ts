import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { User } from '../../user.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  message = '';
  showPassword = false;

  constructor(private http: HttpClient, private router: Router, private userService: UserService,private cdr: ChangeDetectorRef) {}



login() {
  this.http.post<any>('http://localhost:8080/gallery/users/login', {
    email: this.email,
    password: this.password
  }).subscribe({
    next: (user: User) => {
      console.log('User received from backend:', user);
      console.log('📞 Phone Number:', user.phoneNumber); // ✅ check this again


      this.userService.setLoggedInUser(user);
      localStorage.setItem('loggedInUser', JSON.stringify(user));

      if (user.roleId === 3) {
        this.router.navigate(['/customer-homepage']).then(() => window.location.reload());
      } else if ([1, 2, 4, 5, 6].includes(user.roleId)) {
        this.router.navigate(['/admin-dashboard']).then(() => window.location.reload());
      } else {
        this.message = 'Unauthorized role. Please contact support.';
      }
    },
    error: (err) => {
      const errorMsg = err?.error || err?.message || '';

      if (errorMsg === 'Email not verified') {
        Swal.fire({
          icon: 'warning',
          title: 'Email Not Verified',
          text: 'Please verify your email before logging in.',
          confirmButtonText: 'Verify Now',
          showCancelButton: true,
          cancelButtonText: 'Cancel',
        }).then(result => {
          if (result.isConfirmed) {
            this.router.navigate(['/choose-verification'], { queryParams: { email: this.email } }); // Optional: send email as param
          }
        });
      } else if (errorMsg === 'Invalid email' || errorMsg === 'Invalid password') {
        this.message = 'Invalid email or password.';
      } else {
        this.message = 'Login failed. Please try again.';
      }
    }
  });
}


 private performLogin(): void {
    // Simulate API call
    setTimeout(() => {
      // Example success/error handling
      if (this.email === "demo@shophub.com" && this.password === "password") {
        console.log("Login successful")
        // Redirect to dashboard or home page
        // this.router.navigate(['/dashboard']);
      } else {
        this.message = "Invalid email or password. Please try again."
      }
    }, 1000)
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword
  }

  // Social login methods (implement as needed)
  loginWithGoogle(): void {
    console.log("Google login initiated")
    // Implement Google OAuth login
  }

  // Utility method for form reset
  resetForm(): void {
    this.email = ""
    this.password = ""
    this.showPassword = false
    this.message = ""
  }

}
