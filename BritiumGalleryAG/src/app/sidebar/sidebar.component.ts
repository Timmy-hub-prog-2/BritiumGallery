import { Component, ElementRef, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  expanded = false;
  roleId: number | null = null;

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    const user = localStorage.getItem('loggedInUser');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        this.roleId = parsedUser.roleId;
      } catch (error) {
        this.roleId = null;
      }
    }
  }

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
