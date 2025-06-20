import { ChangeDetectorRef, Component } from '@angular/core';

import { User } from '../../user.model';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-view-profile',
  standalone: false,
  templateUrl: './view-profile.component.html',
  styleUrl: './view-profile.component.css',
})
export class ViewProfileComponent {
  user: User = {
    id: 0,
    name: '',
    email: '',
    phoneNumber: '',
    imageUrls: [],
    gender: '',
    password:'',
    status: 0,
    roleId: 3,
    address: '',
    customerType: '' 
  };

  selectedFile?: File;
  profileImageUrlWithTimestamp: string = '';

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.updateProfileImageUrl();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.user.imageUrls = [e.target.result];
        this.updateProfileImageUrl();
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  saveProfile(): void {
    console.log('this user : ', this.user);
    console.log('file : ', this.selectedFile);

    this.userService.updateUserProfile(this.user, this.selectedFile).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.userService.setLoggedInUser(updatedUser);
        this.updateProfileImageUrl();
        alert('Profile saved successfully!');
      },
      error: () => {
        alert('Failed to save profile. Please try again.');
      },
    });
  }

  updateProfileImageUrl(): void {
    if (this.user?.imageUrls && this.user.imageUrls.length > 0) {
      const baseUrl = this.user.imageUrls[0];
      const isBase64 = baseUrl.startsWith('data:image');
  
      this.profileImageUrlWithTimestamp = isBase64
        ? baseUrl // no timestamp for preview
        : baseUrl + '?t=' + new Date().getTime(); // for real URLs
    } else {
      this.profileImageUrlWithTimestamp = 'assets/default-profile.png';
    }
  
    this.cdr.detectChanges();
  }
    

  goToChangePassword() {
    this.router.navigate(['/change-password']);
  }
}
