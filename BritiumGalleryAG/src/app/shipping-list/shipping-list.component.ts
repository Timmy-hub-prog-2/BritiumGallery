import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

export interface ShippingReturnsPolicy {
  id: number;
  title: string;
  content: string;
  displayOrder: number;
}

@Component({
  selector: 'app-shipping-list',
  standalone: false,
  templateUrl: './shipping-list.component.html',
  styleUrl: './shipping-list.component.css'
})

export class ShippingListComponent implements OnInit {
  policies: ShippingReturnsPolicy[] = [];
  private apiUrl = 'http://localhost:8080/api/policy';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.getPolicies();
  }

  // Method directly in the component
  getPolicies(): void {
    this.http.get<ShippingReturnsPolicy[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.policies = data;
      },
      error: (err) => {
        console.error('Failed to load shipping policies:', err);
      }
    });
  }
}