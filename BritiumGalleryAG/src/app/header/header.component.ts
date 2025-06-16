import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  cartCount: number = 0;
  searchQuery: string = '';

  constructor() { }

  ngOnInit(): void {
    // Initialize cart count from service if needed
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      // Implement search functionality
      console.log('Searching for:', this.searchQuery);
    }
  }

  onCartClick(): void {
    // Implement cart click functionality
    console.log('Cart clicked');
  }

  onProfileClick(): void {
    // Implement profile click functionality
    console.log('Profile clicked');
  }
}
