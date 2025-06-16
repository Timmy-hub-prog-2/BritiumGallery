import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone:false,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'BritiumGalleryAG';
  roleId: number | null = null;

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
  }
}
