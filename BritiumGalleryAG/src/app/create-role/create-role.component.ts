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
  this.http
    .post<any>('http://localhost:8080/gallery/users/superadmin/createAdmin', this.userDto)
    .subscribe(
      (response) => {
        if (response && response.message) {
          alert('Admin created successfully. Login details were sent to email.');
        } else {
          alert('An error occurred while creating the admin. Please try again.');
        }
        this.router.navigate(['/admin-dashboard']);
      },
      (error) => {
        console.error('Error creating admin:', error);
        alert('An error occurred while creating the admin');
      }
    );
}



}
