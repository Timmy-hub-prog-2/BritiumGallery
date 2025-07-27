import { Component, OnInit, OnDestroy } from '@angular/core';
import { BlogService } from '../blog.service';
import { BlogPost } from '../blog-create/blog-create.component';
import { HomepageService } from '../services/homepage.service';

@Component({
  selector: 'app-customer-homepage',
  standalone: false,
  templateUrl: './customer-homepage.component.html',
  styleUrl: './customer-homepage.component.css'
})
export class CustomerHomepageComponent implements OnInit, OnDestroy {
  newArrivals: any[] = [];
  bestSellers: any[] = [];
  eventDiscountGroups: any[] = [];
  topBestSellers: any[] = [];
  topCategories: any[] = [];
  mainBlog?: BlogPost;

  constructor(private homepageService: HomepageService, private blogService: BlogService) {}

  ngOnInit(): void {
    document.body.classList.add('customer-homepage-active');
    this.homepageService.getNewArrivals(2).subscribe(data => this.newArrivals = data);
    this.homepageService.getBestSellers().subscribe(data => this.bestSellers = data);
    this.homepageService.getTopBestSellers().subscribe(data => {
      this.topBestSellers = data;
      console.log('Top Best Sellers:', this.topBestSellers);
    });
    this.homepageService.getEventDiscountGroups().subscribe(data => {
      this.eventDiscountGroups = data;
      console.log('Event Discount Groups:', this.eventDiscountGroups);
    });
    this.homepageService.getTopCategories(4).subscribe(data => {
      this.topCategories = data;
      console.log('Top Categories:', this.topCategories);
    });
    this.blogService.getMainBlog().subscribe(blog => this.mainBlog = blog);
  }

  ngOnDestroy() {
    document.body.classList.remove('customer-homepage-active');
  }
}
