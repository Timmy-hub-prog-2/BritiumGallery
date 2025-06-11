import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-photo-dialog',
  standalone:false,
  template: `
    <div class="photo-dialog">
      <img [src]="data.url" alt="Full size photo">
    </div>
  `,
  styles: [`
    .photo-dialog {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem;
    }
    .photo-dialog img {
      max-width: 100%;
      max-height: 80vh;
      object-fit: contain;
    }
  `]
})
export class PhotoDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { url: string }) {}
} 