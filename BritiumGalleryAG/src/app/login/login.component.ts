import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { User } from '../../user.model';

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

  constructor(private http: HttpClient, private router: Router, private userService: UserService) {}

 login() {
  this.http.post<any>('http://localhost:8080/gallery/users/login', {
    email: this.email,
    password: this.password
  }).subscribe({
    next: (user: User) => {
      console.log('User received from backend:', user); 
      this.userService.setLoggedInUser(user);
      localStorage.setItem('loggedInUser', JSON.stringify(user));

      // Redirect based on role
      if (user.roleId === 3) {
        this.router.navigate(['/customer-dashboard']);
      } else if (user.roleId === 2) {
        this.router.navigate(['/admin-dashboard']);
      } else {
        this.message = 'Unauthorized role. Please contact support.';
      }
    },
    error: (err) => {
      console.error('Login error', err);
      this.message = err.error?.message || 'Login failed';
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
