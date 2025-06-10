import { Component, ElementRef, HostListener } from '@angular/core';

@Component({
  selector: 'app-admin-nav',
  standalone: false,
  templateUrl: './admin-nav.component.html',
  styleUrl: './admin-nav.component.css'
})
export class AdminNavComponent {
   showUserBox: boolean = false;

  constructor(private eRef: ElementRef) {}

  toggleUserBox() {
    this.showUserBox = !this.showUserBox;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.showUserBox = false;
    }
  }
}