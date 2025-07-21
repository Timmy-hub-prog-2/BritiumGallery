import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone:false,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'BritiumGalleryAG';
  roleId: number | null = null;

  constructor(public router: Router, private userService: UserService) {}

  get isHomePage(): boolean {
    return this.router.url === '/customer-homepage';
  }

  ngOnInit() {
    const user = localStorage.getItem('loggedInUser');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        this.roleId = parsedUser.roleId;
      } catch (error) {
        console.error('Failed to parse loggedInUser', error);
      }
    }
    this.userService.startHeartbeat();
  }
}
