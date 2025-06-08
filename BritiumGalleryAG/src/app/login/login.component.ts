import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'] // ✅ corrected from `styleUrl`
})
export class LoginComponent {
  email = '';
  password = '';
  message = '';
  showPassword = false; // ✅ For toggle password visibility

  constructor(private http: HttpClient, private router: Router) {}

 login() {
  this.http.post<any>('http://localhost:8080/gallery/users/login', {
    email: this.email,
    password: this.password
  }).subscribe({
    next: (user) => {
      console.log('User received from backend:', user); 
      localStorage.setItem('loggedInUser', JSON.stringify(user)); 
      this.router.navigate(['/']);
    },
    error: (err) => {
      console.error('Login error', err);
      this.message = err.error || 'Login failed';
    }
  });
}
}
