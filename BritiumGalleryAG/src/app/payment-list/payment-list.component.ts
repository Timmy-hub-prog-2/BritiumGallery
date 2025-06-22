import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { filter } from 'rxjs/operators';

interface Payment {
  id: number;
  name: string;
  admin_id: number;
  qrPhotoUrls: string[];
}

@Component({
  selector: 'app-payment-list',
  standalone: false,
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.css'],
})
export class PaymentListComponent implements OnInit {
  payments: Payment[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadPayments();

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd &&
            event.urlAfterRedirects === '/payment-list' // reload only on this route
        )
      )
      .subscribe(() => {
        this.loadPayments();
      });
  }

  loadPayments() {
    this.http
      .get<Payment[]>('http://localhost:8080/payment-register')
      .subscribe({
        next: (data) => {
          this.payments = data;
        },
        error: (err) => {
          console.error('Failed to load payments', err);
        },
      });
  }

  create() {
    this.router.navigate(['/payment-register']);
  }

  edit(id: number) {
    this.router.navigate(['/payment-register', id]);
  }

  delete(id: number) {
    if (confirm('Are you sure you want to delete this payment?')) {
      this.http
        .delete(`http://localhost:8080/payment-register/${id}`)
        .subscribe({
          next: () => this.loadPayments(),
          error: (err) => console.error('Delete failed', err),
        });
    }
  }
}
