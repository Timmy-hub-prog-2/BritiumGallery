import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  getLoggedInUser() {
    const user = localStorage.getItem('loggedInUser');
      console.log('User from localStorage:', user); // Check the format
    return user ? JSON.parse(user) : null;
  }

  // Get logged-in user's ID, can return either number or null
  getLoggedInUserId(): number | null {
    const user = this.getLoggedInUser();
    return user ? user.id : null; // Return null if no user is found
  }

  getUserName(): string {
    return this.getLoggedInUser()?.name || '';
  }

  isLoggedIn(): boolean {
    return !!this.getLoggedInUser();
  }

  logout(): void {
    localStorage.removeItem('loggedInUser');
  }
}   