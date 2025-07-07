import { Component, ElementRef, HostListener } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  expanded = false;

  constructor(private elementRef: ElementRef) {}

  toggleSidebar() {
    this.expanded = !this.expanded;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.expanded) {
      const clickedElement = event.target as HTMLElement;
      const sidebarElement = this.elementRef.nativeElement;
      
      // Check if click is outside the sidebar
      if (!sidebarElement.contains(clickedElement)) {
        this.expanded = false;
      }
    }
  }
}
