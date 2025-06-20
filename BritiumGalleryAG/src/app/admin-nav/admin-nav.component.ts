import { Component, ElementRef, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service'; // Adjust path as needed
import { User } from '../../user.model'; // Adjust path as needed
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-nav',
  standalone: false,
  templateUrl: './admin-nav.component.html',
  styleUrl: './admin-nav.component.css'
})
export class AdminNavComponent implements OnInit, OnDestroy {
  showUserBox = false;
  user: User | null = null;
  isProfileMenuVisible = false;
  private userSubscription: Subscription | undefined;

  constructor(private userService: UserService, private router: Router, private eRef: ElementRef) {}

  ngOnInit(): void {
    this.userSubscription = this.userService.currentUser.subscribe((user: User | null) => {
      this.user = user;
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  toggleProfileMenu(event: Event): void {
    event.stopPropagation();
    if (this.user) {
      this.isProfileMenuVisible = !this.isProfileMenuVisible;
    } else {
      this.router.navigate(['/login']);
    }
  }

  logout(): void {
    this.userService.logout();
    this.router.navigate(['/login']);
    this.isProfileMenuVisible = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const profileButton = document.querySelector('.profile-button');
    const profileMenu = document.querySelector('.profile-dropdown-menu');
    if (profileMenu && !profileMenu.contains(target) && profileButton && !profileButton.contains(target)) {
      this.isProfileMenuVisible = false;
    }
  }
}