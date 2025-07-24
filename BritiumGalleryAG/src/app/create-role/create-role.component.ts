import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';


// Define models for UserDto and Role
export class Role {
  id?: number;
  type?: string;
}



export class UserDto {
  name?: string;
  email?: string;
  password?: string;
 phoneNumber?: string;
  roleId?: number;
}


@Component({
  selector: 'app-create-role',
  standalone: false,
  templateUrl: './create-role.component.html',
  styleUrls: ['./create-role.component.css'],
})
export class CreateRoleComponent implements OnInit {
  roles: Role[] = [];
  userDto: UserDto = new UserDto();
  errorMessage: string = '';
  phoneError: string = '';
  emailError: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.getRoles();
  }

  // Get the list of roles from the backend
  getRoles(): void {
   this.http.get<Role[]>('http://localhost:8080/api/roles').subscribe(
      (data) => {
        this.roles = data;
      },
      (error) => {
        console.error('Error fetching roles:', error);
      }
    );
  }

  createAdmin(): void {
    this.errorMessage = '';
    this.phoneError = '';
    this.emailError = '';
    // Frontend email validation
    const email = this.userDto.email ? this.userDto.email.trim() : '';
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$/;
    if (!emailRegex.test(email)) {
      this.emailError = 'Invalid email address.';
      return;
    }
    // Frontend phone number validation
    let phone = this.userDto.phoneNumber ? this.userDto.phoneNumber.trim() : '';
    let normalizedPhone = phone;
    if (phone.startsWith('+959')) {
      normalizedPhone = phone.replace(/^\+959/, '09');
    }
    const phoneRegex = /^09[0-9]{7,9}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      this.phoneError = 'Invalid phone number. Use 09 or +959 and 9-11 digits.';
      return;
    }
    // Save normalized phone to DTO before sending
    this.userDto.phoneNumber = normalizedPhone;
    this.http
      .post<any>('http://localhost:8080/gallery/users/superadmin/createAdmin', this.userDto)
      .subscribe(
        (response) => {
          if (response && response.message) {
            alert('Admin created successfully. Login details were sent to email.');
            this.router.navigate(['/admin-dashboard']);
          } else {
            alert('An error occurred while creating the admin. Please try again.');
          }
        },
        (error) => {
          console.error('Error creating admin:', error);
          if (error && error.error && typeof error.error === 'string' && error.error.includes('Invalid phone number format')) {
            this.phoneError = 'Invalid phone number. Use 09 or +959 and 9-11 digits.';
          } else if (error && error.error && typeof error.error === 'string' && error.error.includes('Phone number already exists')) {
            this.phoneError = 'Phone number already exists.';
          } else if (error && error.error && typeof error.error === 'string' && error.error.includes('Email already exists')) {
            this.emailError = 'Email already exists.';
          } else if (error && error.error && typeof error.error === 'string') {
            this.errorMessage = error.error;
          } else {
            this.errorMessage = 'An error occurred while creating the admin';
          }
        }
      );
  }



}
