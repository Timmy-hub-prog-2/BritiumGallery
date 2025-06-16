import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-content',
  standalone: false,
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.css'],
})
export class ContentComponent {
  isHeroVisible = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
      const rect = heroSection.getBoundingClientRect();
      this.isHeroVisible = rect.top < window.innerHeight;
    }
  }
}
