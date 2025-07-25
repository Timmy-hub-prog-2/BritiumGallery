import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

interface RestockNotificationVariant {
  notificationId: number;
  variantId: number;
  sku: string;
  stock: number;
  price: number;
  imageUrls: string[];
  attributes: { [key: string]: string };
  productId: number;
  productName: string;
  productBasePhoto: string;
}

@Component({
  selector: 'app-user-remainder-list',
  standalone: false,
  templateUrl: './user-remainder-list.component.html',
  styleUrl: './user-remainder-list.component.css'
})
export class UserRemainderListComponent implements OnInit {
  restockVariants: RestockNotificationVariant[] = [];
  isLoading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(private http: HttpClient, private snackBar: MatSnackBar, private router: Router) {}

  ngOnInit(): void {
    this.loadReminders();
  }

  loadReminders() {
    const user = localStorage.getItem('loggedInUser');
    const userId = user ? JSON.parse(user).id : null;
    if (!userId) {
      this.error = 'User not logged in.';
      return;
    }
    this.isLoading = true;
    this.http.get<RestockNotificationVariant[]>(`http://localhost:8080/restock-notification/user?userId=${userId}`)
      .subscribe({
        next: (data) => {
          this.restockVariants = data;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load reminders.';
          this.isLoading = false;
        }
      });
  }

  removeNotification(notificationId: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to remove this restock reminder?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Remove',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#888',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete<{success: boolean}>(`http://localhost:8080/restock-notification/${notificationId}`)
          .subscribe({
            next: (res) => {
              this.restockVariants = this.restockVariants.filter(v => v.notificationId !== notificationId);
              Swal.fire({
                icon: 'success',
                title: 'Removed!',
                text: 'Your restock reminder has been removed.',
                confirmButtonColor: '#222',
                timer: 1500,
                showConfirmButton: false
              });
            },
            error: (err) => {
              Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: 'Failed to remove reminder.',
                confirmButtonColor: '#d32f2f'
              });
            }
          });
      }
    });
  }

  viewDetail(item: RestockNotificationVariant) {
    if (item.productId) {
      this.router.navigate(['/product-detail', item.productId]);
    }
  }
}
