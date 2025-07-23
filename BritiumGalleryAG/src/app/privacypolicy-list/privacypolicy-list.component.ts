import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-privacypolicy-list',
  standalone: false,
  templateUrl: './privacypolicy-list.component.html',
  styleUrl: './privacypolicy-list.component.css'
})
export class PrivacypolicyListComponent implements OnInit {
  policies: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any[]>('http://localhost:8080/api/privacy-policy')
      .subscribe(data => {
        // Only show active policies
        this.policies = data.filter(policy => policy.active);
      });
  }
}