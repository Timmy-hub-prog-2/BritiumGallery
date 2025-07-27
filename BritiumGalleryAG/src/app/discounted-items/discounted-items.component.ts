import { Component, OnInit, OnDestroy } from '@angular/core';
import { HomepageService } from '../services/homepage.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-discounted-items',
  templateUrl: './discounted-items.component.html',
  standalone:false,
  styleUrls: ['./discounted-items.component.css']
})
export class DiscountedItemsComponent implements OnInit, OnDestroy {
  eventDiscountGroups: any[] = [];
  countdowns: { [eventId: string]: string } = {};
  private timer: any;

  constructor(private homepageService: HomepageService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const eventId = params.get('eventId');
      if (eventId) {
        this.homepageService.getEventDiscountGroupById(+eventId).subscribe((data: any) => {
          this.eventDiscountGroups = data ? [data] : [];
          this.updateCountdowns();
          this.timer = setInterval(() => this.updateCountdowns(), 1000);
        });
      } else {
        this.homepageService.getEventDiscountGroups().subscribe((data: any[]) => {
          this.eventDiscountGroups = data;
          this.updateCountdowns();
          this.timer = setInterval(() => this.updateCountdowns(), 1000);
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  updateCountdowns() {
    for (const event of this.eventDiscountGroups) {
      this.countdowns[event.eventId] = this.getCountdown(event.eventDueDate);
    }
  }

  getCountdown(dueDate: string): string {
    const end = new Date(dueDate).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return `${days}d ${hours}h ${minutes}m ${seconds}s left`;
  }

  // Returns an array of 'Key: Value' strings for attribute pills
  getAttributeList(attributes: any): string[] {
    if (!attributes) return [];
    if (Array.isArray(attributes)) {
      return attributes.map(attr => typeof attr === 'string' ? attr : `${attr.key || attr.name}: ${attr.value}`);
    } else if (typeof attributes === 'object') {
      return Object.entries(attributes).map(([key, value]) => `${key}: ${value}`);
    }
    return [];
  }
}
