import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  code = '';
  email = ''; // optional
  newPassword = '';
  confirmPassword = '';
  message = '';
  error = '';

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute) {}

ngOnInit(): void {
  this.code = ''; // only reset the code field
}


  onSubmit() {
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    const payload = {
      code: this.code, // user input only
      newPassword: this.newPassword
    };

    console.log('Payload:', payload);

    this.http.post('http://localhost:8080/gallery/users/auth/validate-code', payload, { responseType: 'text' })
      .subscribe(
        res => {
          this.message = 'Password reset successful';
          this.router.navigate(['/login']);
        },
        err => {
          this.error = err.error?.message || 'Unexpected error';
          console.error(err);
        }
      );
  }
}
