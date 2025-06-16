import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-admin-header',
  standalone: false,
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.css'
})
export class AdminHeaderComponent implements OnInit{
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
