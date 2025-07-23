import { Component, OnInit } from '@angular/core';
import { AboutService } from '../about.service'; // Import AboutService

// Define the About interface directly in this file
export interface About {
  id?: number;
  mission: string;
  vision: string;
  story: string;
  valueText: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-about-list',
  standalone: false,
  templateUrl: './about-list.component.html',
  styleUrls: ['./about-list.component.css']
})
export class AboutListComponent implements OnInit {
  about: About | null = null;

  constructor(private aboutService: AboutService) {}

  ngOnInit() {
    this.aboutService.getAll().subscribe((data) => {
      if (data.length) {
        this.about = data[0]; // Show the first About Us entry
      }
    });
  }
}