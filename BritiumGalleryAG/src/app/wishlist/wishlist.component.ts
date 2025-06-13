import { Component, OnInit } from '@angular/core';
import { WishlistService } from '../wishlist.service';
import { AuthService } from '../AuthService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-wishlist',
  standalone: false,
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent implements OnInit {
  wishlist: any[] = [];

  constructor(
    private wishlistService: WishlistService,
    private authService: AuthService,
    private router:Router
  ) {}

  ngOnInit(): void {
    this.reloadWishlist();
  }

  goToProductDetail(productId: number): void {
  this.router.navigate(['/product-detail', productId]);
}
  reloadWishlist(): void {
    const userId = this.authService.getLoggedInUserId();
    if (userId === null) {
      console.error('User not logged in.');
      return;
    }

    this.wishlistService.getWishlistByUser(userId).subscribe({
      next: (data) => {
        this.wishlist = data;
        console.log('Wishlist loaded:', data);
      },
      error: (err) => {
        console.error('Error loading wishlist for user ID', userId, err);
      }
    });
  }
}
