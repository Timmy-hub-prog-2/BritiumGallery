import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

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

  constructor(private http: HttpClient, private router: Router) { }

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
    this.http
      .post<any>('http://localhost:8080/gallery/users/superadmin/createAdmin', this.userDto)
      .subscribe(
        (response) => {
          if (response && response.message) {
            Swal.fire({
              icon: 'success',
              title: 'Admin Created!',
              text: 'Login details were sent to the email address.',
              timer: 2500,
              showConfirmButton: false
            }).then(() => {
              this.router.navigate(['/admin-dashboard']);
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Failed!',
              text: 'An error occurred while creating the admin. Please try again.'
            });
          }
        },
        (error) => {
          console.error('Error creating admin:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Something went wrong while creating the admin.'
          });
        }
      );
  }

}
