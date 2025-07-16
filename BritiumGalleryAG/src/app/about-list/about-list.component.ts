import { Component, OnInit } from '@angular/core';
import { AboutService } from '../about.service'; // Import AboutService

// Define the About interface directly in this file
export interface About {
  id?: number;
  mission: string;
  vision: string;
  story: string;
  valueText: string;
}

@Component({
  selector: 'app-about-list',
  standalone: false,
  templateUrl: './about-list.component.html',
  styleUrls: ['./about-list.component.css']
})
export class AboutListComponent implements OnInit {
  aboutList: About[] = [];
  private apiUrl = 'http://localhost:8080/api/about'; // The API endpoint to fetch About Us data

  constructor(private aboutService: AboutService) {}

  ngOnInit(): void {
    this.loadAboutList();
  }

  // Method to load About Us data from the AboutService
  loadAboutList(): void {
    this.aboutService.getAll().subscribe({
      next: (data) => {
        this.aboutList = data;
      },
      error: (err) => {
        console.error('Error loading About Us data:', err);
      }
    });
  }
}
