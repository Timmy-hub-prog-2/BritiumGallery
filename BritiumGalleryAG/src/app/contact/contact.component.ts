import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-contact',
  standalone: false,
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit {
  shopAddress: string = '';

  constructor(private http: HttpClient) {}


ngOnInit(): void {
  this.http.get<any>('http://localhost:8080/api/shopaddresses/main').subscribe({
    next: (data) => {
      this.shopAddress = `${data.houseNumber}, ${data.street}, ${data.township}, ${data.city}, ${data.state}, ${data.country}, ${data.postalCode}`;
    },
    error: (err) => {
      this.shopAddress = 'Main address not available';
      console.error('Error loading flagship address', err);
    }
  });
}
}